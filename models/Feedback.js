const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    ratings: {
      safety: { type: Number, min: 1, max: 5, required: true },
      cleanliness: { type: Number, min: 1, max: 5, required: true },
      accessibility: { type: Number, min: 1, max: 5, required: true },
      crowding: { type: Number, min: 1, max: 5, required: true },
      overall: { type: Number, min: 1, max: 5, required: true },
    },
    comment: { type: String, trim: true, maxlength: 1000 },
    flagCount: { type: Number, default: 0 },
    flagStatus: {
      type: String,
      enum: ["none", "pending", "approved", "deleted"],
      default: "none",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);