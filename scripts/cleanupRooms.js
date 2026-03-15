// scripts/cleanupRooms.js
// Run: node scripts/cleanupRooms.js
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env.local");

  mongoose.connection.on("error", (err) => {
    console.warn("Mongoose background connection error:", err.message);
  });

  for (let i = 0; i < 10; i++) {
    try {
      await mongoose.connect(uri, {
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 5000,
        family: 4,
      });

      // Delete all old rooms to start fresh
      const result = await mongoose.connection.db
        .collection("rooms")
        .deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} old room documents`);
      console.log("✓ Rooms database cleaned.");

      await mongoose.disconnect();
      return; // Success, exit
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
      await mongoose.disconnect().catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Failed to cleanup rooms after 10 attempts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
