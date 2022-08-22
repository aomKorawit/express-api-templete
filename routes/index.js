const express = require('express');

const usersRouter = require('./usersRouter');
const imageRouter = require('./imageRouter');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/image', imageRouter);

module.exports = router;
