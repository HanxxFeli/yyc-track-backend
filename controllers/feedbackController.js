const Feedback = require("../models/Feedback");
const Station = require("../models/Station");
const User = require("../models/User");

/**
 * @desc    Submit feedback for a station
 * @route   POST /api/feedback
 * @access  Private
 */
const submitFeedback = async (req, res) => {
  try {
    const { stationId, ratings, comment } = req.body;

    // Validate station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    //Validate user exists
    const user= await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Validate all rating fields are present
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

    const feedback = await Feedback.create({
      userId: req.user.id,
      stationId,
      ratings,
      comment,
    });

    res.status(201).json({
      message: "Feedback submitted successfully.",
      feedbackId: feedback._id
    });
  } catch (err) {
    
    console.error("submitFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Get feedback for a station with pagination and sorting
 * @route   GET /api/feedback/station/:stationId
 * @access  Public
 */
const getFeedbackByStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { page = 1, limit = 20, sort = "newest" } = req.query;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : sort === "rating"
        ? { "ratings.overall": -1 }
        : { createdAt: -1 }; // default: newest

    const feedback = await Feedback.find({
      stationId,
      isDeleted: false,
      flagStatus: { $ne: "deleted" },
    })
      .populate("userId", "username")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Feedback.countDocuments({
      stationId,
      isDeleted: false,
      flagStatus: { $ne: "deleted" },
    });

    res.json({
      stationId,
      stationName: station.name,
      totalFeedback: total,
      page: Number(page),
      results: feedback,
    });
  } catch (err) {
    console.error("getFeedbackByStation error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * @desc    Delete feedback (only by the user who submitted it)
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
    await feedback.deleteOne();

    res.json({ message: "Feedback deleted successfully." });
  } catch (err) {
    console.error("deleteFeedback error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
