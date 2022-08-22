const config = require('../config');
const fs = require('fs');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteImg = () =>
  catchAsync(async (req, res, next) => {
    const getImg = req.body.imgList

    getImg.forEach(item => {
      fs.unlinkSync(item);
    })

    res.status(200).json({
      status: 'deleted image successful',
    });
  });

exports.getOne = (Model, popOptions1, popSelect1, popOptions2, popSelect2) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions1) {
      if(popOptions2)
      {
        query = query.populate(popOptions1, popSelect1).populate(popOptions2, popSelect2);
      }
      else {
        query = query.populate(popOptions1, popSelect1);
      }
    }
    const doc = await query;

    if (!doc) {
      return next(
        new AppError('No document found with that ID', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const filter = {};

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .limitFields()
      .paginate()
      .sort();

    // const doc = await features.query.explain();
    const doc = await features.query;

    const page = +req.query.page || 1;
    const limit = +req.query.limit || +config.pageLimit;

    const query = new APIFeatures()
      .excludedFields()
      .forEach((el) => delete req.query[el]);

    const total = await Model.countDocuments(query);

    res.status(200).json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / +limit),
      currentPage: page,
      perPage: limit,
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'create request successfully',
      data: doc,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) {
      return next(
        new AppError('No document found with that ID', 404)
      );
    }

    res.status(200).json({
      status: 'update request successfully',
      data: doc,
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError('No document found with that ID', 404)
      );
    }

    res.status(200).json({
      status: 'delete request successfully',
      data: doc.name ,
    });
  });

exports.getAllAdmins = (Model) =>
  catchAsync(async (req, res, next) => {
    const filter = {role:'admin'};

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .limitFields()
      .paginate()
      .sort();

    // const doc = await features.query.explain();
    const doc = await features.query;

    const page = +req.query.page || 1;
    const limit = +req.query.limit || +config.pageLimit;

    const total = await Model.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / +limit),
      currentPage: page,
      perPage: limit,
      data: doc,
    });
  });

exports.deleteAdminOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    await Cart.findOneAndDelete({userId:req.params.id});
    await Wishlist.findOneAndDelete({userId:req.params.id});
    await Chat.findOneAndDelete({userId:req.params.id});

    if (!doc) {
      return next(
        new AppError('No document found with that ID', 404)
      );
    }

    res.status(200).json({
      status: 'delete request successfully',
      data: {
        firstName: doc.firstName ,
        email: doc.email
      }
    });
  });