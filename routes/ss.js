/**
 * Station Routes
 *
 * Defines all Express routes for the /api/stations endpoint.
 *
 * Public routes (no auth required):
 *   GET  /api/stations             → list all stations (supports ?search= query)
 *   GET  /api/stations/:stationId  → get a single station by ID
 *
 * Admin-only routes:
 *   POST /api/stations             → create a new station
 *
 * Owned by: Hans
 */

const express = require('express');
const router  = express.Router();

const {
  getAllStations,
  getStationById,
  createStation,
} = require('../controllers/stationController');

const { protect, protectAdmin } = require('../middleware/authMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/stations
 * Returns all stations. Supports optional ?search=name query for filtering.
 */
router.get('/', getAllStations);

/**
 * GET /api/stations/:stationId
 * Returns a single station by its MongoDB ObjectId.
 */
router.get('/:stationId', getStationById);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/stations
 * Creates a new station. Requires admin authentication.
 * Used for seeding and ongoing station management.
 */
router.post('/', protectAdmin, createStation);

module.exports = router;