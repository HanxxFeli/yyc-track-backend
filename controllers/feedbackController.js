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