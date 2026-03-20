const Station = require("../models/Station");
 
/**
 * @desc    Get all stations
 * @route   GET /api/stations
 * @access  Public
 */
const getAllStations = async (req, res) => {
  try {
    const { search } = req.query;
 
    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};
 
    const stations = await Station.find(query);
 
    res.json({
      total: stations.length,
      stations,
    });
  } catch (err) {
    console.error("getAllStations error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
 
/**
 * @desc    Get a single station by ID
 * @route   GET /api/stations/:stationId
 * @access  Public
 */
const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.stationId);
 
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }
 
    res.json(station);
  } catch (err) {
    console.error("getStationById error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
 

module.exports={
  getAllStations,
  getStationById
}