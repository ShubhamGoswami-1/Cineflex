const Movie = require('./../Models/movieModel');
const ApiFeatures = require('../Utils/apiFeatures');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const CustomError = require('./../Utils/CustomError');

exports.getHighestRated = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratings';

    next();
}

exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {
    const features = new ApiFeatures(Movie.find(), req.query)
                                        .filter()
                                        .sorting()
                                        .limitFields()
                                        .paginating();
        
    let movies = await features.query;

    /*
    const excludeFields = ['sort', 'page', 'fields', 'limit'];
    const queryObj = {...req.query};

    excludeFields.forEach((el) => delete queryObj[el]);

    const movies = await Movie.find(queryObj);
    */

    // FILTERING DATA (gte = greater than equal to...)
    // ratings gte 7.0
    // let queryStr = JSON.stringify(req.query);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(queryStr);
    // const queryObj = JSON.parse(queryStr);

    // let query = Movie.find(queryObj);
        
    // SORTING
    // if(req.query.sort){
    //     const sortBy = req.query.sort.split(',').join(' ');
    //     query = query.sort(sortBy);
    // } else {
    //     query = query.sort('-createdAt');
    // }

    // LIMITING
    // if(req.query.fields){
    //     const fields = req.query.fields.split(',').join(' ');
    //     console.log(fields);
    //     query = query.select(fields);
    // }else{
    //     query = query.select('-__v');
    // }

    // PAGINATION
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 10;
    // const skip = (page - 1) * limit;
    // query.skip(skip).limit(limit);

    // if(req.query.page){
    //     const moviesCount = await Movie.countDocuments();
    //     if(skip >= moviesCount){
    //         throw new Error("This page is not found");
    //     }
    // }

    res.status(200).json({
        status: "Success",
        length: movies.length,
        data: {
            movies
        }
    });
});

exports.getMovie = asyncErrorHandler (async (req, res, next) => {
    
    const movie = await Movie.findById(req.params.id);

    if(!movie){
        const err = new CustomError('Movie with that ID is not found!', 404);
        return next(err);
    }

    res.status(200).json({
        status: "Success",
        data: {
            movie
        }
    });
});

exports.createMovie = asyncErrorHandler (async (req, res, next) => {
    const movie = await Movie.create(req.body)

    res.status(201).json({
        status: "Success",
        data: {
            movie
        }
    })
});

exports.updateMovie = asyncErrorHandler (async (req, res, next) => {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

    if(!updatedMovie){
        const err = new CustomError('Movie with that ID is not found!', 404);
        return next(err);
    }

    res.status(200).json({
        status: "Success",
        data: {
            movie: updatedMovie
        }
    }); 
});

exports.deleteMovie = asyncErrorHandler (async (req, res, next) => {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

    if(!deletedMovie){
        const err = new CustomError('Movie with that ID is not found!', 404);
        return next(err);
    }

    res.status(204).json({
        status: "Success",
        data: null
    });  
})

exports.getMovieStats = asyncErrorHandler (async (req, res) => {
    const stats = await Movie.aggregate([
        {$match: {ratings: {$gte: 4.5}}},
        {$group: {
            _id: '$releaseYear',
            avgRating: {$avg: '$ratings'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max: '$price'},
            priceTotal: {$sum: '$price'},
            movieCount: {$sum: 1}
        }},
        {$sort: {minPrice: 1}},
        {$match: {maxPrice: {$lte: 60}}}
    ]);

    res.status(200).json({
        status: "Success",
        count: stats.length,
        data: {
            stats
        }
    }); 
});

exports.getMovieByGenre = asyncErrorHandler (async (req, res, next) => {
    const genre = req.params.genre;
    const movies = await Movie.aggregate([
        {$unwind: '$genres'},
        {$group: {
            _id: '$genres',
            movieCount: {$sum: 1},
            movies: {$push: '$name'},
        }},
        {$addFields: {genre: '$_id'}},
        {$project: {_id: 0}},
        {$sort: {movieCount: -1}},
        {$match: {genre: genre}}
    ]);
    res.status(200).json({
        status: "Success",
        count: movies.length,
        data: {
            movies
        }
    });
});