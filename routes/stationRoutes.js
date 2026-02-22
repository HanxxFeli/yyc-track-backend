/**
 * Station Routes
 *
 * Defines all station lookup endpoints for the YYC-Track app.
 * All logic is handled in stationController.js
 *
 * GET /api/stations        - get all stations, filter by location and/or amenities
 * GET /api/stations/:id    - get a single station by ID
 */

const express = require("express");
const router = express.Router();
const {
  getStations,
  getStationById,
} = require("../controllers/stationController");

/**
 * @route   GET /api/stations
 * @desc    Get all stations filtered by location, transit lines, and amenities
 * @access  Public
 */
router.get("/", getStations);

/**
 * @route   GET /api/stations/:id
 * @desc    Get full details for a single station by ID
 * @access  Public
 */
router.get("/:id", getStationById);

module.exports = router;
