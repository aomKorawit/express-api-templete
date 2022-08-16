const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('aomKorawit_Login', token, {
    expires: new Date(
      // Expires in 20 miniute!!
      Date.now() +
        // process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        20 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  let newUser = {}

  if (req.body.type === "sso") {
    console.log("sso");
    newUser = await User.create({
      firstName: req.body.displayName,
      lastName: req.body.lastName ? req.body.lastName : "",
      email: req.body.email,
      role: "user",
    });
  } else {
    console.log("!sso");
    newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      role: "user",
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    })
  }

  // req.protocol = http or https
  const url = `${req.protocol}://${req.get('host')}/me`;
  //   console.log(url);
  await new Email(newUser, url).sendWelcome();

  await Cart.create({
    userId: newUser.id,
    productCartList: []
  });
  await Wishlist.create({
    userId: newUser.id,
    productWishlistList: []
  });

  createSendToken(newUser, 201, req, res);
});

exports.signUpAdmin = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    role: 'admin',
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  await Cart.create({
    userId: newUser.id,
    productCartList: []
  });
  await Wishlist.create({
    userId: newUser.id,
    productWishlistList: []
  });

  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password, type, accessToken } = req.body;

  let user = null;

  // 1) Check if email and password exist

  if ((!email || !password) && type !== "sso") {
    return next(new AppError("Please provide email and password!", 400));
  }

  if (type === "sso") {
    // decode token

    user = await User.findOne({ email }).select("-password");
    if (!user) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    console.log("current user =>", user);
    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res);     
  } else {
    // 2) Check if user exists && password is correct
    user = await User.findOne({ email }).select("+password");

    //   console.log(user);
    const nowDate = new Date().getTime()
    const checkLock = new Date(user.lockExpried).getTime()
    
    if(!(user.lockExpried) || (nowDate > checkLock))
    {
      if(user.lockExpried)
      {
        await User.findOneAndUpdate(
          { email },
          {
            $unset: { 
              lockExpried: "",
            },
          },
          {
            new: true,
          }
        )    
      }

      if (
        !user ||
        !(await user.correctPassword(password, user.password))
      ) {
        const wrongCount = user.wrongPassword
        if(wrongCount)
        {
          if(wrongCount < 2)
          {
            await User.findOneAndUpdate(
              { email },
              { $inc: { wrongPassword : 1 } },
              {
                new: true,
              }
            )  
            res.status(401).json({
              status: 'fail',
              message: `Incorrect email or password. Attempts remaining: ${ 2 - wrongCount }`,
              messageThai: `อีเมล์ หรือ รหัสผ่านไม่ถูกต้อง เหลือโอกาสอีก ${ 2 - wrongCount } ครั้ง`,
            });          
          }
          else
          {
            const unlockDate = new Date(Date.now() + 15 * 60 * 1000)      
            const lockUser = await User.findOneAndUpdate(
              { email },
              { 
                lockExpried : unlockDate,
                $unset: { wrongPassword: "" },
              },
              {
                new: true,
              }
            ) 
            const end = new Date(lockUser.lockExpried)
            const now = new Date();
            const distance = end - now;
          
            const remain = Math.floor((distance % (60000 * 60)) / (1000 * 60))
            const remainSec = Math.floor((distance % (1000 * 60)) / 1000)
        
            res.status(401).json({
              status: 'fail',
              message: `This user is locked. Please wait another ${ remain !== 0 ? remain + ' minutes.' : remainSec + ' seconds.' }`,
              messageThai: `บัญชีผู้ใช้งานนี้ถูกจำกัดสิทธิ์การใช้งาน โปรดลองอีกครั้งในอีก ${ remain !== 0 ? remain + ' นาที' : remainSec + ' วินาที' }`,
            });                 
          }
        }
        else
        {
          await User.findOneAndUpdate(
            { email },
            { $inc: { wrongPassword : 1 } },
            {
              new: true,
            }
          )
          res.status(401).json({
            status: 'fail',
            message: `Incorrect email or password. Attempts remaining: 2`,
            messageThai: `อีเมล์ หรือ รหัสผ่านไม่ถูกต้อง เหลือโอกาสอีก 2 ครั้ง`,
          });
        } 
      }
      else
      {
        if(user.wrongPassword)
        {
          await User.findOneAndUpdate(
            { email },
            {
              $unset: { 
                wrongPassword: "",
              },
            },
            {
              new: true,
            }
          )    
        } 
        // 3) If everything ok, send token to client
        createSendToken(user, 200, req, res);           
      }
    }
    else if(user.lockExpried)
    {
      const end = new Date(user.lockExpried)
      const now = new Date();
      const distance = end - now;
    
      const remain = Math.floor((distance % (60000 * 60)) / (1000 * 60))
      const remainSec = Math.floor((distance % (1000 * 60)) / 1000)

      res.status(401).json({
        status: 'fail',
        message: `This user is locked. Please wait another ${ remain !== 0 ? remain + ' minutes.' : remainSec + ' seconds.' }`,
        messageThai: `บัญชีผู้ใช้งานนี้ถูกจำกัดสิทธิ์การใช้งาน โปรดลองอีกครั้งในอีก ${ remain !== 0 ? remain + ' นาที' : remainSec + ' วินาที' }`,
      });     
    }
  }
});

exports.logout = (req, res) => {
  res.cookie('aomKorawit_Login', 'loggedout', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.aomKorawit_Login) {
    token = req.cookies.aomKorawit_Login;
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please log in to get access.',
        401
      )
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password! Please log in again.',
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.aomKorawit_Login) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.aomKorawit_Login,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      // new AppError('There is no user with email address.', 404)
      new AppError('We could not find the resource you requested.', 404)
    );
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    //const imgURL = `${req.protocol}://${req.get('host')}/img/Nomaroi.png`;
    const resetURL = `https://nomaroi.com/changePassword/?token=${resetToken}`;
    // console.log(resetURL);
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!'
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const { token } = req.params;

  if (!token) {
    return next(new AppError('Something went wrong', 500));
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user).select('+password');
  // 2) Check if POSTed current password is correct
  if (
    !(await user.correctPassword(req.body.oldPassword, user.password))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  const pattern = /^(?=.*\d)(?=.*[a-z]).{8,}$/
  if(pattern.test(req.body.password))
  {
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
  }
  else
  {
    return next(new AppError(`Your new password doesn't follow the required pattern.`, 401));
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  const user = await User.findOneAndUpdate(
    { "_id" : req.user },
    { 
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,   
      "address.addressDetail": req.body.address.addressDetail,
      "address.subDistrict": req.body.address.subDistrict,
      "address.district": req.body.address.district,
      "address.province": req.body.address.province,
      "address.postalCode": req.body.address.postalCode
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});