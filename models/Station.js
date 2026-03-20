/**
 * Station Model
 *
 * Represents a CTrain station in Calgary.
 *
 * Data sources:
 *   - name, line, coordinates, gtfsStopId → seeded from Calgary Transit
 *     static GTFS feed (stops.txt). Updated occasionally when CT publishes
 *     a new static GTFS package.
 *   - cei, averageRatings, totalFeedback → computed by the CEI utility
 *     and updated automatically whenever feedback is submitted or deleted.
 *
 * The gtfsStopId is the critical link between this document and all GTFS-RT
 * data. When the Azure Function syncs trip updates or service alerts, it
 * matches incoming stop_id values to this field to find the right station.
 *
 * Owned by: Hans
 */

const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    /** Display name of the station (e.g. "City Hall") */
    name: {
      type: String,
      required: [true, 'Station name is required'],
      unique: true,
      trim: true,
    },

    /** CTrain line the station belongs to */
    line: {
      type: String,
      enum: {
        values: ['Red', 'Blue', 'Both'],
        message: 'Line must be either Red or Blue',
      },
      required: [true, 'Line is required'],
    },

    /** Geographic coordinates for map rendering */
    coordinates: {
      lat: { type: Number, required: [true, 'Latitude is required'] },
      lng: { type: Number, required: [true, 'Longitude is required'] },
    },

    /**
     * The stop_id value from the Calgary Transit static GTFS feed (stops.txt).
     * This is the join key used by the Azure Function when syncing GTFS-RT
     * trip updates and service alerts into MongoDB.
     *
     * Example: "8157" for City Hall station.
     *
     * sparse: true means the unique index ignores null values, so stations
     * that haven't been linked to GTFS yet won't cause duplicate key errors.
     */
    gtfsStopId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    /**
     * Community Experience Index — composite quality score scaled 0–100.
     * Automatically recalculated by utils/cei.js whenever feedback changes.
     */
    cei: {
      type: Number,
      default: null,
    },

    /**
     * Per-category average ratings across all non-deleted feedback (1–5 scale).
     * Automatically recalculated by utils/cei.js.
     */
    averageRatings: {
      safety:        { type: Number, default: null },
      cleanliness:   { type: Number, default: null },
      accessibility: { type: Number, default: null },
      crowding:      { type: Number, default: null },
      overall:       { type: Number, default: null },
    },

    /** Count of non-deleted feedback entries for this station */
    totalFeedback: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Station', stationSchema);