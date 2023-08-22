const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const moviesRouter = require('./Routes/moviesRoutes');
const authRouter = require('./Routes/authRouter');
const CustomError = require('./Utils/CustomError');
const globalErrorHandler = require('./Controllers/errorController');

const app = express();

app.use(express.json());

// Global Middlewares
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try after an hour! :)'
});
app.use('/api', limiter);

app.use(express.static('./public'));
app.use((req, res, next) => { // Middleware
    req.requestedAt = new Date().toISOString();
    next();
})

app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1/users', authRouter);
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: "Failed",
    //     message: `The url with ${req.originalUrl} doesn't exists on the server`
    // })
    // const err = new Error(`The url with ${req.originalUrl} doesn't exists on the server`);
    // err.status = 'Failed';
    // err.statusCode = 404;
    const err = new CustomError(`The url with ${req.originalUrl} doesn't exists on the server`, 404);
    next(err);
});

app.use(globalErrorHandler);

module.exports = app;
