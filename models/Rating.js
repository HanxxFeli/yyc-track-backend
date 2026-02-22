/**
 * Rating Model
 *
 * Represents a user's rating of a charging station. Each user may submit
 * only one rating per station, enforced by a unique compound index.
 *
 * Ratings include an overall score and optional per-category breakdowns.
 */

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    // The station being rated
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    // The user submitting the rating
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Overall rating score (1-5)
    rating: { type: Number, required: true, min: 1, max: 5 },
    // Optional scores across station quality categories
    categories: {
        cleanliness: { type: Number, min: 1, max: 5 },
        safety: { type: Number, min: 1, max: 5 },
        accessibility: { type: Number, min: 1, max: 5 },
        amenities: { type: Number, min: 1, max: 5 }
    }
}, { timestamps: true });

// Prevents a user from submitting more than one rating for the same station
ratingSchema.index({ station: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);