const Feedback = require("../models/Feedback");
const Station = require("../models/Station");
const User = require("../models/User");
const { recalculateStationCEI } = require("../utils/cei");
const { analyzeContent } = require("../utils/contentSafety");

/**
 * @desc    Submit feedback for a station
 * @route   POST /api/feedback
 * @access  Private
 */
const submitFeedback = async (req, res) => {
  try {
    const { stationId, ratings, comment } = req.body;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const requiredFields = [
      "safety",
      "cleanliness",
      "accessibility",
      "crowding",
      "overall",
    ];
    for (const field of requiredFields) {
      if (ratings[field] === undefined || ratings[field] === null) {
        return res
          .status(400)
          .json({ error: `Missing required rating field: ${field}` });
      }
    }

    // Run comment through Azure Content Safety
    const safetyResult = await analyzeContent(comment);
    const flagStatus = safetyResult.flagged ? "pending" : "none";

    const feedback = await Feedback.create({
      userId: req.user.id,
      stationId,
      ratings,
      comment,
      flagStatus,
    });

    await recalculateStationCEI(stationId);

    res.status(201).json({
      message: "Feedback submitted successfully.",
      feedbackId: feedback._id,
      ...(safetyResult.flagged && {
        notice: "Your comment is under review and will be visible once approved.",
      }),
    });
  } catch (err) {
    console.error("submitFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Get all feedback for a station (no pagination)
 * @route   GET /api/feedback/station/:stationId
 * @access  Public
 */
const getFeedbackByStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { sort = "newest" } = req.query;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : sort === "rating"
        ? { "ratings.overall": -1 }
        : { createdAt: -1 };

    const feedback = await Feedback.find({
      stationId,
      isDeleted: false,
      flagStatus: { $ne: "pending" }, // show "none" and "archived"
    })
      .populate("userId", "username")
      .sort(sortOption);

    res.json({
      stationId,
      stationName: station.name,
      totalFeedback: feedback.length,
      results: feedback,
    });
  } catch (err) {
    console.error("getFeedbackByStation error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Get the logged-in user's own feedback across all stations
 * @route   GET /api/feedback/mine
 * @access  Private
 */
const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      userId: req.user.id,
      isDeleted: false,
      flagStatus: { $ne: "pending" }, // show "none" and "archived"
    }).populate("stationId", "name line");

    res.json({ feedback });
  } catch (err) {
    console.error("getMyFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Delete own feedback (soft delete)
 * @route   DELETE /api/feedback/:feedbackId
 * @access  Private
 */
const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    if (feedback.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this feedback." });
    }

    await feedback.deleteOne()

    await recalculateStationCEI(feedback.stationId);

    res.json({ message: "Feedback deleted successfully." });
  } catch (err) {
    console.error("deleteFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────

/**
 * @desc    Get all pending feedback awaiting admin review
 * @route   GET /api/feedback/admin/pending
 * @access  Admin
 */
const getPendingFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      flagStatus: "pending",
      isDeleted: false,
    })
      .populate("userId", "username email")
      .populate("stationId", "name line")
      .sort({ createdAt: -1 });

    res.json({
      total: feedback.length,
      results: feedback,
    });
  } catch (err) {
    console.error("getPendingFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Get all archived feedback (reviewed and approved by admin)
 * @route   GET /api/feedback/admin/archived
 * @access  Admin
 */
const getArchivedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      flagStatus: "archived",
      isDeleted: false,
    })
      .populate("userId", "username email")
      .populate("stationId", "name line")
      .sort({ createdAt: -1 });

    res.json({
      total: feedback.length,
      results: feedback,
    });
  } catch (err) {
    console.error("getArchivedFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Get all archived feedback (reviewed and approved by admin)
 * @route   GET /api/feedback/admin/archived
 * @access  Admin
 */
const getDeletedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      isDeleted: true,
    })
      .populate("userId", "username email")
      .populate("stationId", "name line")
      .sort({ createdAt: -1 });

    res.json({
      total: feedback.length,
      results: feedback,
    });
  } catch (err) {
    console.error("getArchivedFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Approve pending feedback — moves to archived, becomes public, counts in CEI
 * @route   PATCH /api/feedback/admin/:feedbackId/approve
 * @access  Admin
 */
const approveFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    if (feedback.flagStatus !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending feedback can be approved." });
    }

    feedback.flagStatus = "archived";
    await feedback.save();

    // Now counts toward CEI since $ne "pending" includes "archived"
    await recalculateStationCEI(feedback.stationId);

    res.json({ message: "Feedback approved and is now publicly visible." });
  } catch (err) {
    console.error("approveFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Admin permanently deletes inappropriate feedback
 * @route   DELETE /api/feedback/admin/:feedbackId
 * @access  Admin
 */
const adminDeleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    const stationId = feedback.stationId;
    // Soft delete: mark as deleted instead of removing
    feedback.isDeleted = true;
    await feedback.save();

    await recalculateStationCEI(stationId);

    res.json({ message: "Feedback permanently deleted." });
  } catch (err) {
    console.error("adminDeleteFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByStation,
  getMyFeedback,
  deleteFeedback,
  getPendingFeedback,
  getArchivedFeedback,
  approveFeedback,
  adminDeleteFeedback,
  getDeletedFeedback
};