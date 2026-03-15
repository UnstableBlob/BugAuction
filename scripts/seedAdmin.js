// scripts/seedAdmin.js
// Run: node scripts/seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

            const AdminSchema = new mongoose.Schema({
                email: { type: String, unique: true, required: true },
                passwordHash: { type: String, required: true },
            });
            const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

            const email = process.env.ADMIN_EMAIL || 'admin@csi.com';
            const password = process.env.ADMIN_PASSWORD || 'Admin@CSI2025';
            const passwordHash = await bcrypt.hash(password, 10);

            await Admin.findOneAndUpdate(
                { email },
                { email, passwordHash },
                { upsert: true, new: true }
            );

            console.log(`✓ Admin seeded: ${email}`);
            await mongoose.disconnect();
            return; // Exit loop on success
        } catch (e) {
            console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
            await mongoose.disconnect().catch(() => { });
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    throw new Error('Failed to seed Admin after 5 attempts due to network errors');
}

main().catch((err) => { console.error(err); process.exit(1); });
