const express = require('express');
const authController = require('../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


// Protect all routes after this middleware
router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', authController.updateMe);
router.get('/me', userController.getMe, userController.getUser);
router.use(authController.restrictTo('admin'));

//router.route('/').get(userController.getAllUsers);

router
  .route('/admin')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllAdmins
  )
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    authController.signUpAdmin
  );

router
  .route('/admin/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getUser
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    userController.updateAdmin
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    userController.deleteAdmin
  );

module.exports = router;
