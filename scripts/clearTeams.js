// scripts/clearTeams.js
// Run: node scripts/clearTeams.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env.local');

    mongoose.connection.on('error', (err) => {
        console.warn('Mongoose background connection error:', err.message);
    });

    for (let i = 0; i < 5; i++) {
        try {
            await mongoose.connect(uri, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000 });

            const TeamSchema = new mongoose.Schema({}, { strict: false });
            const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

            // _id must be String so 'teamTid' doesn't get cast to ObjectId
            const CounterSchema = new mongoose.Schema({ _id: { type: String } }, { strict: false });
            const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

            const SessionSchema = new mongoose.Schema({}, { strict: false });
            const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

            const teamResult = await Team.deleteMany({});
            console.log(`✓ Deleted ${teamResult.deletedCount} team(s) from the database`);

            const sessionResult = await Session.deleteMany({});
            console.log(`✓ Deleted ${sessionResult.deletedCount} session(s) from the database`);

            // Reset the tid counter so team numbering starts fresh
            await Counter.deleteOne({ _id: 'teamTid' });
            console.log('✓ Reset team ID counter');

            await mongoose.disconnect();
            return;
        } catch (e) {
            console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
            await mongoose.disconnect().catch(() => { });
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    throw new Error('Failed to clear teams after 5 attempts');
}

main().catch((err) => { console.error(err); process.exit(1); });
