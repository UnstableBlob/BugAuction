import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Team from '@/models/Team';

export async function POST(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (team.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });

        const { direction } = await req.json();
        if (!['next', 'prev'].includes(direction)) {
            return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
        }

        await connectDB();
        const total = team.assignedPuzzleIds.length;
        let newIndex = team.currentIndex;

        if (direction === 'next' && newIndex < total - 1) newIndex++;
        if (direction === 'prev' && newIndex > 0) newIndex--;

        await Team.findByIdAndUpdate(team._id, { currentIndex: newIndex });
        return NextResponse.json({ success: true, currentIndex: newIndex });
    } catch (err) {
        console.error('Navigate error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
