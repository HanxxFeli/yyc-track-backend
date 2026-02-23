/**
 * Rating Routes
 *
 * Defines all rating endpoints for the YYC-Track app.
 * All logic is handled in ratingController.js
 * mergeParams allows access to :stationId from the parent route in app.js
 *
 * POST /api/stations/:stationId/ratings - submit a rating for a station
 * GET  /api/stations/:stationId/ratings - get all ratings for a station
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const {
    submitRating,
    getRatings
} = require('../controllers/ratingController');

/**
 * @route   POST /api/stations/:stationId/ratings
 * @desc    Submit a 1-5 rating with optional category breakdowns for a station
 * @access  Private
 */
router.post('/', protect, submitRating);

/**
 * @route   GET /api/stations/:stationId/ratings
 * @desc    Get all ratings for a station with overall and category averages
 * @access  Public
 */
router.get('/', getRatings);

module.exports = router;