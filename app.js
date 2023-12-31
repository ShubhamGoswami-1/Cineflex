const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const  mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const moviesRouter = require('./Routes/moviesRoutes');
const authRouter = require('./Routes/authRouter');

const CustomError = require('./Utils/CustomError');
const globalErrorHandler = require('./Controllers/errorController');

const app = express();

// Global Middlewares

// Set Security HTTP Headers
app.use(helmet());

// Development Logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Limit requests from same IP (Rate - Limiting)
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try after an hour! :)'
});
app.use('/api', limiter);

// Body-Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // limit the amount of data to req.body (Security measures)

// Data Sanitization against NoSQL query Injection
app.use(mongoSanitize()); // Removes all '$' or '.' signs from the body, qury strings and params 

// Data Sanitization against XSS
app.use(xss()); // detects html codes 

// Prevent Parameter Pollution
app.use(hpp({
    whitelist: [ // Fields mentioned in whitelist are allowed to have duplicates in query string
        'duration',
        'ratings',
        'releaseYear',
        'releaseDate',
        'createdAt',
        'genres',
        'actors',
        'directors',
        'price'
    ] // Rest of the field like sort is not allowed to have duplicate vals in query. 
})); 

// Serving Static Files
app.use(express.static('./public'));

// Test Middleware
app.use((req, res, next) => { 
    req.requestedAt = new Date().toISOString();
    //console.log(req.headers);
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
