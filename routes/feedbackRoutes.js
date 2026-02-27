const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth"); // your existing auth middleware
const {
  submitFeedback,
  getFeedbackByStation,
  deleteFeedback,
  getMyFeedback,
} = require("../controllers/feedbackController");

// Public
router.get("/station/:stationId", getFeedbackByStation);

// Protected (logged in users)

/**
 * @route   GET /api/feedback/mine
 * @desc    Get current logged in user's feedback
 * @access  Private (requires valid JWT token)
 */
router.get("/mine", protect, getMyFeedback);

/**
 * @route   POST /api/feedback/mine
 * @desc    Submit feedback for current logged in user
 * @access  Private (requires valid JWT token)
 */
router.post("/", protect, submitFeedback);

/**
 * @route   DELETE /api/feedback/:feedbackId
 * @desc    Delete feedback by ID (only by the user who submitted it)
 * @access  Private (requires valid JWT token)
 */
router.delete("/:feedbackId", protect, deleteFeedback);

module.exports = router;