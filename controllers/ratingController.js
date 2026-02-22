/**
 * Rating Controller
 *
 * Handles station rating and feedback logic.
 * Ratings include an overall score and optional category breakdowns.
 * Feedback is written and can be submitted anonymously.
 */

const Rating = require("../models/Rating");
const Feedback = require("../models/Feedback");
const Station = require("../models/Station");

/**
 * @desc    Submit a rating for a station
 *          Each user can only rate a station once
 * @route   POST /api/stations/:stationId/ratings
 * @access  Private
 */
const submitRating = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { rating, categories } = req.body;

    // get the logged in user's id from the token (set by protect middleware)
    const user = req.user.id;

    // confirm the station exists before saving the rating
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const newRating = await Rating.create({
      station: stationId,
      user,
      rating,
      categories,
    });

    res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error(`Submit rating error: ${error.stack}`);

    //means this user already rated this station
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already rated this station",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error submitting rating",
    });
  }
};

/**
 * @desc    Get all ratings for a station with overall and percategory averages
 * @route   GET /api/stations/:stationId/ratings
 * @access  Public
 */
const getRatings = async (req, res) => {
  try {
    const { stationId } = req.params;

    // confirm the station exists before querying ratings
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    // fetch all ratings for this station, sorted newest first
    const ratings = await Rating.find({ station: stationId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    // calculate the overall average rating
    const count = ratings.length;
    const average =
      count > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
        : null;

    // calculate averages for each category, skipping entries where that category was not rated
    const categoryAverages = [
      "cleanliness",
      "safety",
      "accessibility",
      "amenities",
    ].reduce((acc, key) => {
      const valid = ratings.filter((r) => r.categories?.[key] != null);
      acc[key] =
        valid.length > 0
          ? (
              valid.reduce((sum, r) => sum + r.categories[key], 0) /
              valid.length
            ).toFixed(1)
          : null;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count,
      average,
      categoryAverages,
      ratings,
    });
  } catch (error) {
    console.error(`Get ratings error: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: "Server error fetching ratings",
    });
  }
};

/**
 * @desc    Submit written feedback for a station
 * @route   POST /api/stations/:stationId/feedback
 * @access  Private
 */
const submitFeedback = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { comment, category, isAnonymous } = req.body;

    // get the logged in user's id from the token
    const user = req.user.id;

    // confirm the station exists before saving feedback
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const feedback = await Feedback.create({
      station: stationId,
      user,
      comment,
      category,
      isAnonymous,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error(`Submit feedback error: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: "Server error submitting feedback",
    });
  }
};

/**
 * @desc    Get all feedback for a station, optionally filtered by category
 *          Anonymous submissions have their user field removed from the response
 * @route   GET /api/stations/:stationId/feedback
 * @access  Public
 */
const getFeedback = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { category } = req.query;

    // confirm the station exists before querying feedback
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    // build filter - always scoped to this station, optionally by category
    const filter = { station: stationId };
    if (category) filter.category = category;

    const feedback = await Feedback.find(filter)
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    // remove user info from any feedback marked as anonymous before sending response
    const sanitised = feedback.map((f) => {
      const obj = f.toObject();
      if (obj.isAnonymous) obj.user = null;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: sanitised.length,
      feedback: sanitised,
    });
  } catch (error) {
    console.error(`Get feedback error: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: "Server error fetching feedback",
    });
  }
};

module.exports = {
  submitRating,
  getRatings,
  submitFeedback,
  getFeedback,
};
