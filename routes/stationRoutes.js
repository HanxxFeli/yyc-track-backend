const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middleware/auth");
const {
  getAllStations,
  getStationById,
} = require("../controllers/stationController");
 
// Public
router.get("/", getAllStations);
router.get("/:stationId", getStationById);
 
module.exports = router;
 