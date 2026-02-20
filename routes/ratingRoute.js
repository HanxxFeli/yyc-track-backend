// Rating Routes
//
// Handles station ratings for the YYC-Track app.
// Authenticated users can submit a rating (1-5) with optional category breakdowns
// (cleanliness, safety, accessibility, amenities). Each user can only rate a station once.
// Fetching ratings also returns the overall average and per-category averages.

const express = require("express");
const router = express.Router({ mergeParams: true });
const Rating = require("../models/Rating");         //ratingModel
const Station = require("../models/Station");       //stationModel
const { protect } = require("../middleware/auth");

// Submit a rating for a station
// Users can only rate a station once; enforced by index in Rating.js
router.post("/", protect, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { rating, categories } = req.body;

    // Get the logged in user's id from the token
    const user = req.user.id;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    const newRating = await Rating.create({
      station: stationId,
      user,
      rating,
      categories,
    });

    res.status(201).json(newRating);
  } catch (err) {
    // 11000 is a Mongo duplicate key error; means this user already rated this station
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already rated this station" });
    }
    res
      .status(500)
      .json({ message: "Failed to submit rating", error: err.message });
  }
});

// Get all ratings for a station
// Returns the full list plus overall average and per-category averages
router.get("/", async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    const ratings = await Rating.find({ station: stationId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    // Calculate the overall average rating
    const count = ratings.length;
    const average =
      count > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
        : null;

    // Calculate averages for each category, skipping entries where that category was not rated
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

    res.json({ count, average, categoryAverages, ratings });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch ratings", error: err.message });
  }
});

module.exports = router;
