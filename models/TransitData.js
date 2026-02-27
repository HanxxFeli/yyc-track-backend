/**
 * TransitData Model
 *
 * Caches the most recent predicted arrival times for each CTrain station,
 * sourced from the Calgary Transit GTFS-RT Trip Updates feed.
 *
 * Sync strategy (replace on every sync):
 *   The Azure Function performs an upsert keyed on stationId, fully replacing
 *   the previous document with fresh data. At any point there is exactly ONE
 *   TransitData document per station — always the latest sync.
 *
 *   To switch to rolling history later: remove the upsert, insert instead,
 *   and add a TTL index on syncedAt to auto-expire old documents.
 *
 * GTFS-RT source: Trip Updates feed
 *   stop_time_update.arrival.time  → predictedArrival (Unix ts → Date)
 *   trip.trip_id                   → tripId
 *   trip.route_id                  → routeId
 *
 * Owned by: Hans
 */

const mongoose = require('mongoose');

/**
 * A single predicted arrival at this station.
 * One entry per trip expected to stop here in the current sync window.
 */
const arrivalSchema = new mongoose.Schema(
  {
    /**
     * GTFS trip_id for the vehicle running this service.
     * Can be cross-referenced with static GTFS for headsign/shape data.
     */
    tripId: {
      type: String,
      required: true,
    },

    /**
     * GTFS route_id identifying the CTrain line.
     * e.g. "201" = Red Line, "202" = Blue Line
     */
    routeId: {
      type: String,
      required: true,
    },

    /**
     * Predicted arrival time at this station.
     * Converted from Unix timestamp (GTFS-RT) to JS Date during sync.
     */
    predictedArrival: {
      type: Date,
      required: true,
    },
  },
  { _id: false } // embedded sub-document — no separate _id needed
);

const transitDataSchema = new mongoose.Schema(
  {
    /**
     * The station this snapshot belongs to.
     * unique: true enforces exactly one TransitData document per station.
     */
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      unique: true,
    },

    /**
     * All upcoming predicted arrivals at this station from the latest sync.
     * Sorted ascending by predictedArrival during the sync so the
     * soonest arrival is always arrivals[0].
     */
    arrivals: [arrivalSchema],

    /** Timestamp of the last successful GTFS-RT sync for this station */
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TransitData', transitDataSchema);