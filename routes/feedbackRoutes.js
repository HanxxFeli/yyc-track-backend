/**
 * Feedback Routes
 *
 * Defines all feedback endpoints for the YYC-Track app.
 * All logic is handled in ratingController.js
 * mergeParams allows access to :stationId from the parent route in app.js
 *
 * POST /api/stations/:stationId/feedback - submit feedback for a station
 * GET  /api/stations/:stationId/feedback - get all feedback for a station
 */

const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middleware/auth");
const {
  submitFeedback,
  getFeedback,
} = require("../controllers/ratingController");

/**
 * @route   POST /api/stations/:stationId/feedback
 * @desc    Submit written feedback categorised as issue, suggestion, compliment, or general
 * @access  Private
 */
router.post("/", protect, submitFeedback);

/**
 * @route   GET /api/stations/:stationId/feedback
 * @desc    Get all feedback for a station, optionally filtered by ?category=
 * @access  Public
 */
router.get("/", getFeedback);

module.exports = router;
