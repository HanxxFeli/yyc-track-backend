// Station Routes

// Handles all station lookup endpoints for the YYC-Track app.
// Allows users to find nearby transit charging stations using location coordinates,
// filter by transit line (red/blue), and filter by available amenities.

// GET /api/stations        - get all stations, filter by location and/or amenities
// GET /api/stations/:id    - get a single station by ID

const express = require("express");
const router = express.Router();
const Station = require("../models/Station");
const { protect } = require("../middleware/auth");

// Get all stations
// Supports optional filters: lng/lat/radius for location, lines, and amenities
router.get("/", async (req, res) => {
  try {
    const {
      lng,
      lat,
      radius = 5000,
      lines,
      parking,
      bikeRack,
      shelter,
      accessible,
      elevator,
      escalator,
    } = req.query;

    const filter = {};

    // If coordinates are provided, find stations within the given radius
    // Requires the 2dsphere index to be set on Station.location
    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    // Filter by transit line if provided e.g. red, blue
    if (lines) {
      filter.lines = { $in: lines.split(",") };
    }

    // Filter by amenities - only applied if the query param is set to "true"
    if (parking === "true") filter["amenities.parking"] = true;
    if (bikeRack === "true") filter["amenities.bikeRack"] = true;
    if (shelter === "true") filter["amenities.shelter"] = true;
    if (accessible === "true") filter["amenities.accessibleEntrance"] = true;
    if (elevator === "true") filter["amenities.elevator"] = true;
    if (escalator === "true") filter["amenities.escalator"] = true;

    const stations = await Station.find(filter);
    res.json(stations);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stations", error: err.message });
  }
});

// Get a single station by its ID
router.get("/:id", async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    res.json(station);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch station", error: err.message });
  }
});

module.exports = router;
