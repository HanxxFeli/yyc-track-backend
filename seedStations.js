/**
 * Seed Script — CTrain Stations
 *
 * Pulls station data from the Azure GTFS function and seeds MongoDB.
 * Run once: node scripts/seedStations.js
 *
 * - routeId 201 → Red
 * - routeId 202 → Blue
 * - both 201 and 202 → Both
 * - anything else → skipped (not a CTrain station)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Station = require("./models/Station");

const GTFS_URL = "https://yyc-track-functions.azurewebsites.net/api/ctrain/stops";

const getLine = (routeIds) => {
  const hasRed = routeIds.includes("201");
  const hasBlue = routeIds.includes("202");

  if (hasRed && hasBlue) return "Both";
  if (hasRed) return "Red";
  if (hasBlue) return "Blue";
  return null; // not a CTrain station — skip
};

const seedStations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Fetch from Azure Function
    console.log(`📡 Fetching stations from:\n   ${GTFS_URL}\n`);
    const response = await fetch(GTFS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const stops = data.stops;
    console.log(`📦 Total stops received: ${stops.length}`);

    let inserted = 0;
    let skipped = 0;
    let duplicates = 0;

    for (const stop of stops) {
      const line = getLine(stop.routeIds);

      // Skip stops that aren't on route 201 or 202
      if (!line) {
        skipped++;
        continue;
      }

      try {
        await Station.create({
          name: stop.name,
          line,
          coordinates: {
            lat: stop.latitude,
            lng: stop.longitude,
          },
          gtfsStopId: stop.stopId,
        });
        console.log(`   ✅ Inserted: ${stop.name} (${line} Line)`);
        inserted++;
      } catch (err) {
        if (err.code === 11000) {
          // Station already exists — skip silently
          console.log(`   ⚠️  Duplicate skipped: ${stop.name}`);
          duplicates++;
        } else {
          throw err;
        }
      }
    }

    console.log("\n─────────────────────────────────");
    console.log(`✅ Inserted:   ${inserted} stations`);
    console.log(`⚠️  Duplicates: ${duplicates} skipped`);
    console.log(`⏭️  Skipped:    ${skipped} non-CTrain stops`);
    console.log("─────────────────────────────────");
    console.log("🎉 Seed complete.\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedStations();
