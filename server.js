const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config({path: './config.env'})

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log("Uncaught Expception occured! Shutting down... :(")
    
    process.exit(1);
});

const app = require('./app');

console.log(process.env.NODE_ENV);

mongoose.connect(process.env.CONN_STR, {
    UseNewUrlParser: true
}).then((conn) => {
    console.log('DB Connection Successful...');
})

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log("Server is Running...");
})

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log("Unhandled Rejection occured! Shutting down... :(")
    
    server.close(() => {
        process.exit(1);
    });
});

