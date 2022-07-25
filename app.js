/* eslint-disable no-console */
// const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
//const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./helpers/globalErrorHandler');

// Config env
dotenv.config({ path: './.env' });

// Creating server
const app = express();

// Serving static files
app.use(express.static(`${__dirname}/public`));

app.use('/img', express.static('img'));

// 1) GLOBAL MIDDLEWARE
// Implement CORS
app.use(cors({
  credentials: true,
  origin: ["http://localhost:8080","http://localhost:3005"]
}));

app.options('*', cors());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message:
//     'Too many requests from this IP, please try again in an hour!',
// });

// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({ whitelist: ['price'] }));

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //   console.log(req.cookies);
  next();
});

// ROUTES

// api
app.use('/api', require('./routes'));

// 404 handler
app.all('*', (req, res, next) => {
  next(
    new AppError(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

app.use(globalErrorHandler);

// Connect Database MongoDB
require('./config/database');

// Run server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Running on port ${port}...`);
});
