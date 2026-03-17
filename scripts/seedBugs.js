const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const BUGS_DIR = path.join(process.cwd(), 'bugs');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env.local');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Minimal Puzzle schema
    const PuzzleSchema = new mongoose.Schema({
        puzzleId: { type: String, unique: true, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        prompt: { type: String, required: true },
        uiConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
        answer: { type: mongoose.Schema.Types.Mixed, required: true },
        points: { type: Number, default: 0 },
    });
    const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

    const items = fs.readdirSync(BUGS_DIR);
    const folders = items.filter(item => fs.statSync(path.join(BUGS_DIR, item)).isDirectory());

    console.log(`Found ${folders.length} bug folders.`);

    const puzzles = folders.map((folder, index) => ({
        puzzleId: `BUG-${(index + 1).toString().padStart(2, '0')}`,
        type: 'logic',
        title: folder,
        prompt: `Fix the bug in the provided zip file. The answer to this puzzle is the folder name itself: "${folder}".`,
        answer: folder,
        points: Math.floor(Math.random() * (500 - 100 + 1)) + 100, // Random points between 100 and 500
        uiConfig: {
            downloadUrl: `/bugs/${folder}.zip` // We'll move them to public/bugs/
        }
    }));

    console.log('Clearing existing puzzles...');
    await Puzzle.deleteMany({});
    console.log('Existing puzzles cleared.');

    console.log('Inserting bug puzzles...');
    await Puzzle.insertMany(puzzles);
    console.log('Bug puzzles inserted successfully successfully into DB.');

    // --- NEW: Write to JSON file ---
    const DATA_DIR = path.join(process.cwd(), 'data');
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    const JSON_PATH = path.join(DATA_DIR, 'puzzles.json');
    fs.writeFileSync(JSON_PATH, JSON.stringify(puzzles, null, 2));
    console.log(`Successfully wrote ${puzzles.length} puzzles to ${JSON_PATH}`);
    // -------------------------------

    await mongoose.disconnect();
    console.log('Disconnected.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
