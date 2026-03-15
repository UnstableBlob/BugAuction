import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SessionHistory from "@/models/SessionHistory";

export async function GET(req) {
    try {
        const admin = await getAdminFromRequest(req);
        if (!admin)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const history = await SessionHistory.find()
            .sort({ clearedAt: -1 })
            .lean();

        return NextResponse.json({ history });
    } catch (err) {
        console.error("Session history error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const admin = await getAdminFromRequest(req);
        if (!admin)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const result = await SessionHistory.deleteMany({});

        return NextResponse.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        console.error("Clear session history error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
