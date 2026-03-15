// scripts/seedTeams.js
// Run: node scripts/seedTeams.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env.local');

    mongoose.connection.on('error', (err) => {
        console.warn('Mongoose background connection error:', err.message);
    });

    for (let i = 0; i < 10; i++) {
        try {
            await mongoose.connect(uri, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000, family: 4 });

            const TeamSchema = new mongoose.Schema({
                tid: { type: String, unique: true, required: true },
                teamName: { type: String, default: '' },
                passwordHash: { type: String, required: true },
                status: { type: String, default: 'inactive' },
                activeRoomId: { type: mongoose.Schema.Types.ObjectId, default: null },
                assignedPuzzleIds: [{ type: String }],
                currentIndex: { type: Number, default: 0 },
                solvedPuzzleIds: [{ type: String }],
                penaltySeconds: { type: Number, default: 0 },
                lastLoginAt: { type: Date, default: null },
            });
            const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

            const defaultPassword = process.env.TEAM_DEFAULT_PASSWORD || 'team123';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            const ops = [];
            // Default seed count is zero; set SEED_TEAM_COUNT environment variable to a positive integer if you want test teams
    const count = parseInt(process.env.SEED_TEAM_COUNT || '0', 10);
    for (let j = 1; j <= count; j++) {
                const tid = `T${String(j).padStart(2, '0')}`;
                const teamName = `Team ${String(j).padStart(2, '0')}`;
                ops.push({
                    updateOne: {
                        filter: { tid },
                        update: {
                            $setOnInsert: {
                                tid, teamName, passwordHash,
                                status: 'inactive',
                                activeRoomId: null,
                                assignedPuzzleIds: [],
                                currentIndex: 0,
                                solvedPuzzleIds: [],
                                penaltySeconds: 0,
                                lastLoginAt: null,
                            },
                        },
                        upsert: true,
                    },
                });
            }

            await Team.bulkWrite(ops);
            console.log(`✓ Seeded 20 teams (T01–T20) with password: "${defaultPassword}"`);
            await mongoose.disconnect();
            return; // Success, exit
        } catch (e) {
            console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
            await mongoose.disconnect().catch(() => { });
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    throw new Error('Failed to seed Teams after 10 attempts');
}

main().catch((err) => { console.error(err); process.exit(1); });
