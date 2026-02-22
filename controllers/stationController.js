/**
 * Station Controller
 *
 * Handles all station lookup logic for the YYC-Track app.
 * Supports filtering stations by location, transit lines, and amenities.
 */

const Station = require("../models/Station");

/**
 * @desc    Get all stations, optionally filtered by location and/or amenities
 * @route   GET /api/stations
 * @access  Public
 */
const getStations = async (req, res) => {
  try {
    const { lng, lat, radius = 5000, lines, ...amenityParams } = req.query;

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

    // Map query param names to their corresponding amenities field in the Station model
    // Only applied if the query param is set to "true"
    const amenityFieldMap = {
      parking: "amenities.parking",
      bikeRack: "amenities.bikeRack",
      shelter: "amenities.shelter",
      accessible: "amenities.accessibleEntrance",
      elevator: "amenities.elevator",
      escalator: "amenities.escalator",
    };

    Object.entries(amenityFieldMap).forEach(([param, field]) => {
      if (amenityParams[param] === "true") filter[field] = true;
    });

    const stations = await Station.find(filter);
    res.status(200).json({
      success: true,
      count: stations.length,
      stations,
    });
  } catch (error) {
    console.error(`Get stations error: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: "Server error fetching stations",
    });
  }
};

/**
 * @desc    Get full details for a single station by its MongoDB ID
 * @route   GET /api/stations/:id
 * @access  Public
 */
const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    res.status(200).json({
      success: true,
      station,
    });
  } catch (error) {
    console.error(`Get station by ID error: ${error.stack}`);

    // Handle invalid MongoDB ID format
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error fetching station",
    });
  }
};

module.exports = {
  getStations,
  getStationById,
};
