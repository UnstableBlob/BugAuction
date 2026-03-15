import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { setAdminCookie } from '@/lib/session';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        await connectDB();
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

        const res = NextResponse.json({ success: true, email: admin.email });
        setAdminCookie(res, admin.email);
        return res;
    } catch (err) {
        console.error('Admin login error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
