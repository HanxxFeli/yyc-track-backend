/**
 * Transit Routes
 *
 * Defines all Express routes for the /api/transit endpoint.
 *
 * Public routes:
 *   GET  /api/transit/station/:stationId → arrivals + alerts for one station
 *   GET  /api/transit/all               → arrivals + alerts for all stations
 *
 * Admin-only routes:
 *   POST /api/transit/sync              → called by Azure Function to push synced data
 *
 * Owned by: Hans
 */

const express = require('express');
const router  = express.Router();

const {
  syncTransitData,
  getStationTransit,
  getAllTransit,
} = require('../controllers/transitController');

const { protectAdmin } = require('../middleware/auth');

// ─── Admin / Azure Function Routes ───────────────────────────────────────────

/**
 * POST /api/transit/sync
 * Receives pre-parsed GTFS-RT data from the Azure Function and writes it
 * to MongoDB. Protected so only the Azure Function (with an admin JWT) can call it.
 *
 * The Azure Function should:
 *   1. Pull the GTFS-RT protobuf feeds from Calgary Transit
 *   2. Decode them using gtfs-realtime-bindings (Node.js)
 *   3. Transform to the JSON shape expected by syncTransitData
 *   4. POST to this endpoint with Authorization: Bearer <admin_token>
 */
router.post('/sync', protectAdmin, syncTransitData);

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/transit/all
 * Returns cached arrivals and service alerts for all stations.
 * NOTE: this route must be defined BEFORE /:stationId to avoid Express
 * treating "all" as a stationId parameter.
 */
router.get('/all', getAllTransit);

/**
 * GET /api/transit/station/:stationId
 * Returns cached arrivals and active service alerts for a single station.
 * :stationId is the MongoDB ObjectId of the station.
 */
router.get('/station/:stationId', getStationTransit);

module.exports = router;