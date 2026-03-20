const Feedback = require("../models/Feedback");
const Station = require("../models/Station");
const mongoose = require("mongoose");

/**
 * CEI Formula (Commuter Experience Index)
 *
 * Weighted average of all 5 rating categories across ALL submissions
 * for a station, scaled to 0-100.
 *
 * Weights reflect what matters most to commuters:
 *   Safety:        25%
 *   Overall:       25%
 *   Cleanliness:   20%
 *   Accessibility: 20%
 *   Crowding:      10%
 *
 * Example: weighted avg = 3.8 out of 5 → CEI = (3.8 / 5) * 100 = 76.0
 *
 * Uses MongoDB aggregation pipeline to do all math in a single DB call.
 */

const WEIGHTS = {
  safety: 0.25,
  overall: 0.25,
  cleanliness: 0.2,
  accessibility: 0.2,
  crowding: 0.1,
};

const recalculateStationCEI = async (stationId) => {
  const result = await Feedback.aggregate([
    {
      // Step 1: Filter to only active feedback for this station
      $match: {
        stationId: new mongoose.Types.ObjectId(stationId),
        isDeleted: false,
        flagStatus: { $ne: "pending" },
      },
    },
    {
      // Step 2: Group all feedback together and compute per-category averages
      $group: {
        _id: "$stationId",
        totalFeedback:    { $sum: 1 },
        avgSafety:        { $avg: "$ratings.safety" },
        avgCleanliness:   { $avg: "$ratings.cleanliness" },
        avgAccessibility: { $avg: "$ratings.accessibility" },
        avgCrowding:      { $avg: "$ratings.crowding" },
        avgOverall:       { $avg: "$ratings.overall" },
      },
    },
    {
      // Step 3: Apply weights and scale to 100
      $project: {
        _id: 0,
        totalFeedback: 1,

        // Store rounded per-category averages for the station dashboard charts
        averageRatings: {
          safety:        { $round: ["$avgSafety", 2] },
          cleanliness:   { $round: ["$avgCleanliness", 2] },
          accessibility: { $round: ["$avgAccessibility", 2] },
          crowding:      { $round: ["$avgCrowding", 2] },
          overall:       { $round: ["$avgOverall", 2] },
        },

        // Weighted average then scaled: (weightedAvg / 5) * 100
        cei: {
          $round: [
            {
              $multiply: [
                {
                  $add: [
                    { $multiply: ["$avgSafety",        WEIGHTS.safety] },
                    { $multiply: ["$avgCleanliness",   WEIGHTS.cleanliness] },
                    { $multiply: ["$avgAccessibility", WEIGHTS.accessibility] },
                    { $multiply: ["$avgCrowding",      WEIGHTS.crowding] },
                    { $multiply: ["$avgOverall",       WEIGHTS.overall] },
                  ],
                },
                20, // scale 1-5 range to 20-100
              ],
            },
            1, // round to 1 decimal place
          ],
        },
      },
    },
  ]);

  if (result.length === 0) {
    // All feedback deleted — reset station scores
    await Station.findByIdAndUpdate(stationId, {
      cei: null,
      totalFeedback: 0,
      averageRatings: {
        safety: null,
        cleanliness: null,
        accessibility: null,
        crowding: null,
        overall: null,
      },
    });
    return;
  }

  const { totalFeedback, averageRatings, cei } = result[0];

  await Station.findByIdAndUpdate(stationId, {
    cei,
    totalFeedback,
    averageRatings,
  });
};

module.exports = { recalculateStationCEI };