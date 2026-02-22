/**
 * Station Model
 *
 * Represents a transit charging station, including its location, transit line
 * associations, available amenities, and operating hours.
 */

const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    // Display name of the station
    name: { type: String, required: true },
    // Unique short code identifying the station
    code: { type: String, required: true, unique: true },
    // Transit lines that serve this station
    lines: [{ type: String, enum: ['red', 'blue'] }],
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    // Street address
    address: String,
    // Features available at the station
    amenities: {
        parking: { type: Boolean, default: false },
        bikeRack: { type: Boolean, default: false },
        shelter: { type: Boolean, default: false },
        accessibleEntrance: { type: Boolean, default: false },
        elevator: { type: Boolean, default: false },
        escalator: { type: Boolean, default: false }
    },
    // Operating hours displayed to users
    operatingHours: {
        weekday: String,
        weekend: String
    }
}, { timestamps: true });

// Required for $near geospatial queries in stationController
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);