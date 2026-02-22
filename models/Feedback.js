/**
 * Feedback Model
 *
 * Represents a user's written feedback for a charging station. Feedback is
 * categorised by intent (issue, suggestion, compliment, or general) and can
 * optionally be submitted anonymously.
 */

const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    // The station this feedback refers to
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    // The user submitting the feedback
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // The feedback text, capped at 1000 characters
    comment: { type: String, required: true, maxlength: 1000 },
    // Classifies the nature of the feedback to aid filtering and triage
    category: {
      type: String,
      enum: ["issue", "suggestion", "compliment", "general"],
      default: "general",
    },
    // Controls whether the submitting user's identity is shown publicly
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
