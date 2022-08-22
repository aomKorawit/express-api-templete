const express = require('express');
const authController = require('../controllers/authController');
const promotionController = require('../controllers/imageController');
const {
  uploadProductImages,
  resizerImages,
  uploadStatusImages,
  convertImages
} = require('../helpers/imageProcessor');
const router = express.Router();

router
  .route('/upload')
  .post(
    authController.protect,
    uploadProductImages,
    resizerImages,
    uploadStatusImages,
  );

router
  .route('/delete')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    promotionController.deleteImg
  );

router
  .route('/convert')
  .get(
    authController.protect,
    convertImages,
  );

module.exports = router;
