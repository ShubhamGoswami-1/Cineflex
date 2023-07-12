const mongoose = require('mongoose');
const fs = require('fs');
const validator = require('validator');

const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required field!'],
        unique: true,
        maxlength: [100, 'Movie name must not have more than 100 characters'],
        minlength: [4, 'Movie name must have at least 4 characters'],
        trim: true,
        // validate: [validator.isAlpha, "The movie name must only be alphabets"]
    },
    description: {
        type: String,
        required: [true, 'Description is required field'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required field!']
    },
    ratings: {
        type: Number,
        validate: {
            validator: function(value) {
                return value >= 1 && value <= 10;
            },
            message: "The Ratings {{VALUE}} must be above or equal to 1 and below or equal to 10"
        }
    },
    totalRatings: {
        type: Number
    },
    releaseYear: {
        type: Number,
        required: [true, 'Release Year is required field!']
    },
    releaseDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    genres: {
        type: [String],
        required: [true, 'Genres is required field!'],
        // enum: {
        //     values: ["Action", "Adventure", "Sci-Fi", "Thriller", "Crime", "Drama", "Comedy", "Romance", "Biography"],
        //     message: "This genre does not exists ! :("
        // }
    },
    directors: {
        type: [String],
        required: [true, 'Directors is required field!']
    },
    coverImage: {
        type: String,
        required: [true, 'Cover Image is required field!']
    },
    actors: {
        type: [String],
        required: [true, 'Actors is required field!']
    },
    price: {
        type: Number,
        required: [true, 'Price is required field!']
    },
    createdBy: {
        type: String
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

movieSchema.virtual('durationInHours').get(function() {
    return this.duration / 60;
})

// Document Middlewares
// save hook will be executed the document is saved in DB
// .save() or .create()
// not work with .insertMany() , findByIdAndUpdate
movieSchema.pre('save', function(next) {
    this.createdBy = 'Thee';
    next();
});

movieSchema.post('save', function(doc, next) {
    const content =  `A new movie document with name ${doc.name} has been created by ${doc.createdBy}\n`
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (error) => {
        console.log(error.message);
    })
    next();
});

// Query Middlewares
// /^ regex used for find findOne findById findByIdAndUpdate whatever starts with find
movieSchema.pre(/^find/, function(next) {
    this.find({releaseDate: {$lte: Date.now()}});
    this.startTime = Date.now();
    next();
})

movieSchema.post(/^find/, function(docs, next) {
    this.find({releaseDate: {$lte: Date.now()}});
    this.endTime = Date.now();
    const content = `Query took ${this.endTime - this.startTime} miliseconds to fetch the documents\n`;
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (error) => {
        console.log(error.message);
    })
    next();
})

movieSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: {releaseDate : {$lte: new Date()}}});
    next();
})

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;