/**
 * ServiceAlert Model
 *
 * Stores active and recent service disruptions synced from the Calgary
 * Transit GTFS-RT Service Alerts feed.
 *
 * Sync strategy (replace on every sync):
 *   The Azure Function clears all existing alerts and inserts the current
 *   set from the feed on each sync cycle. This keeps the collection as a
 *   clean mirror of what Calgary Transit is actively broadcasting.
 *
 *   Alternatively, alerts can be upserted by their GTFS alert_id if you
 *   want to preserve history — swap the delete+insert for a findOneAndUpdate
 *   with upsert: true keyed on gtfsAlertId.
 *
 * GTFS-RT source: Service Alerts feed
 *   alert.header_text               → title
 *   alert.description_text          → description
 *   alert.cause                     → cause  (GTFS-RT Cause enum)
 *   alert.effect                    → effect (GTFS-RT Effect enum)
 *   alert.active_period[].start     → activePeriod.start (Unix ts → Date)
 *   alert.active_period[].end       → activePeriod.end   (Unix ts → Date)
 *   alert.informed_entity[].stop_id → affectedStopIds    (maps to gtfsStopId)
 *   alert.informed_entity[].route_id→ affectedRouteIds
 *
 * Owned by: Hans
 */

const mongoose = require('mongoose');

/**
 * GTFS-RT Cause enum values (as defined in the GTFS-RT spec).
 * Calgary Transit may not use all of these, but we store whatever the feed sends.
 */
const CAUSE_VALUES = [
  'UNKNOWN_CAUSE',
  'OTHER_CAUSE',
  'TECHNICAL_PROBLEM',
  'STRIKE',
  'DEMONSTRATION',
  'ACCIDENT',
  'HOLIDAY',
  'WEATHER',
  'MAINTENANCE',
  'CONSTRUCTION',
  'POLICE_ACTIVITY',
  'MEDICAL_EMERGENCY',
];

/**
 * GTFS-RT Effect enum values.
 * Describes how the disruption affects service.
 */
const EFFECT_VALUES = [
  'NO_SERVICE',
  'REDUCED_SERVICE',
  'SIGNIFICANT_DELAYS',
  'DETOUR',
  'ADDITIONAL_SERVICE',
  'MODIFIED_SERVICE',
  'OTHER_EFFECT',
  'UNKNOWN_EFFECT',
  'STOP_MOVED',
  'NO_EFFECT',
  'ACCESSIBILITY_ISSUE',
];

const serviceAlertSchema = new mongoose.Schema(
  {
    /**
     * The original alert ID from the GTFS-RT feed entity.
     * Useful for deduplication if switching to an upsert sync strategy.
     */
    gtfsAlertId: {
      type: String,
      trim: true,
    },

    /**
     * Short headline for the alert, shown prominently in the UI.
     * Sourced from alert.header_text (English translation).
     * e.g. "Red Line Delays — Erlton/Stampede Station"
     */
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },

    /**
     * Full explanation of the disruption.
     * Sourced from alert.description_text (English translation).
     */
    description: {
      type: String,
      trim: true,
    },

    /**
     * Why the disruption is happening.
     * Mapped directly from the GTFS-RT Cause enum.
     */
    cause: {
      type: String,
      enum: {
        values: CAUSE_VALUES,
        message: 'Invalid cause value',
      },
      default: 'UNKNOWN_CAUSE',
    },

    /**
     * What impact the disruption has on service.
     * Mapped directly from the GTFS-RT Effect enum.
     */
    effect: {
      type: String,
      enum: {
        values: EFFECT_VALUES,
        message: 'Invalid effect value',
      },
      default: 'UNKNOWN_EFFECT',
    },

    /**
     * The time window during which this alert is active.
     * An alert may have multiple active periods in the GTFS-RT feed;
     * we store the first/primary period here for simplicity.
     * Both fields are optional — Calgary Transit doesn't always set an end time.
     */
    activePeriod: {
      start: { type: Date, default: null },
      end:   { type: Date, default: null },
    },

    /**
     * GTFS stop_ids affected by this alert.
     * These correspond to the gtfsStopId field on Station documents,
     * allowing the frontend to highlight affected stations on the map.
     *
     * e.g. ["8157", "8158"] for City Hall and Victoria Park/Stampede.
     */
    affectedStopIds: {
      type: [String],
      default: [],
    },

    /**
     * GTFS route_ids affected by this alert.
     * e.g. ["201"] = Red Line only, ["201", "202"] = both lines
     */
    affectedRouteIds: {
      type: [String],
      default: [],
    },

    /** Timestamp of the sync that created/last updated this alert */
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quickly finding alerts affecting a specific stop
serviceAlertSchema.index({ affectedStopIds: 1 });

// Index for finding active alerts by time window
serviceAlertSchema.index({ 'activePeriod.start': 1, 'activePeriod.end': 1 });

module.exports = mongoose.model('ServiceAlert', serviceAlertSchema);