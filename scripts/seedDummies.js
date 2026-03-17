import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Dummy puzzles data
const dummyPuzzles = [];
for (let i = 1; i <= 20; i++) {
  dummyPuzzles.push({
    puzzleId: `dummy-${i}`,
    type: "logic", // Just a fallback type
    title: `Dummy Puzzle ${i}`,
    prompt: `This is dummy puzzle ${i}. Please enter the correct string to submit.`,
    answer: `answer${i}`,
  });
}

// Minimal Puzzle schema (avoid importing Next.js models in raw Node script if possible)
const puzzleSchema = new mongoose.Schema({
  puzzleId: String,
  type: String,
  title: String,
  prompt: String,
  answer: mongoose.Schema.Types.Mixed,
});
const Puzzle = mongoose.models.Puzzle || mongoose.model("Puzzle", puzzleSchema);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    console.log("Clearing existing puzzles...");
    await Puzzle.deleteMany({});
    console.log("Existing puzzles cleared.");

    console.log("Inserting 20 dummy puzzles...");
    await Puzzle.insertMany(dummyPuzzles);
    console.log("Dummy puzzles inserted successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding puzzles:", error);
    process.exit(1);
  }
}

seed();
