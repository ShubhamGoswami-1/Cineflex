const express = require('express');
const moviesController = require('./../Controllers/moviesController');
const authController = require('./../Controllers/authController');

const router = express.Router();

// Middleware for checking whether an id is valid movie object or not
// router.param('id', moviesController.checkId);

router.route('/movie-stats').get(moviesController.getMovieStats);

router.route('/movies-by-genre/:genre').get(moviesController.getMovieByGenre);

router.route('/highest-rated').get(moviesController.getHighestRated ,moviesController.getAllMovies)

router.route('/')
    .get(authController.protect, moviesController.getAllMovies)
    .post(moviesController.createMovie);

router.route('/:id')
    .get(authController.protect, moviesController.getMovie)
    .patch(moviesController.updateMovie)
    .delete(authController.protect, authController.restrict('admin'), moviesController.deleteMovie);

module.exports = router;