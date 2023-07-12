const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

const Movie = require('./../Models/movieModel');

dotenv.config({path: './config.env'})

mongoose.connect(process.env.CONN_STR, {
    UseNewUrlParser: true
}).then((conn) => {
    console.log("DB Connection Successful...")
}).catch((error) => {
    console.log("Some error in DB Connection ... :(");
});

const movies = JSON.parse(fs.readFileSync('./data/movies.json', 'utf-8'));

//Delete existing movies documents from collection
const deleteMovies = async() => {
    try {
        await Movie.deleteMany();
        console.log("Data Successfully Deleted :) !");
    }  catch (error) {
        console.log(error.message);
    }
    process.exit();
}

// Import Movies to mongoDb collection 
const importMovies = async () => {
    try {
        await Movie.create(movies);
        console.log("Data Successfully Imported :) !");
    } catch (error) {
        console.log(error.message);
    }
    process.exit();
}

// deleteMovies();
// importMovies();

if(process.argv[2] === '--import'){
    importMovies();
}
if(process.argv[2] === '--delete'){
    deleteMovies();
}
console.log(process.argv);