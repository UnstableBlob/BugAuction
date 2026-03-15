import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import Puzzle from '@/models/Puzzle';
import Team from '@/models/Team';



export async function GET(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // ── Waiting state ─────────────────────────────────────────────────────────
        // Always return 'waiting' — admin must explicitly approve the team.
        // The approve-teams endpoint handles puzzle assignment and promotion.
        if (team.status === 'waiting') {
            return NextResponse.json({ status: 'waiting' });
        }

        // ── Terminal states ──────────────────────────────────────────────────────
        if (team.status === 'success') return NextResponse.json({ status: 'success' });
        if (team.status === 'caught') return NextResponse.json({ status: 'caught' });

        if (team.status !== 'playing') {
            return NextResponse.json({ status: team.status });
        }

        // ── Playing state ────────────────────────────────────────────────────────
        // Re-fetch team from DB so we get the latest assignedPuzzleIds (may have
        // just been written by the promotion block above in a concurrent request).
        const freshTeam = await Team.findById(team._id).lean();

        // Resolve session for time calculations
        let session = null;
        if (freshTeam.activeSessionId) session = await Session.findById(freshTeam.activeSessionId);
        if (!session) session = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 });
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

        // If session has ended, redirect to results
        if (session.status === 'ended') {
            return NextResponse.json({ status: 'ended', shouldRedirect: '/team/results' });
        }

        // Calculate timeLeft
        const now = Date.now();
        const endTime = new Date(session.startedAt).getTime() + session.durationMinutes * 60 * 1000;
        const timeLeft = Math.floor((endTime - now) / 1000) - (freshTeam.penaltySeconds || 0);

        // Auto-catch if time expired
        if (timeLeft <= 0) {
            await Team.findByIdAndUpdate(freshTeam._id, { status: 'caught' });
            return NextResponse.json({ status: 'caught' });
        }

        // Guard against empty assignedPuzzleIds (race condition on first poll)
        if (!freshTeam.assignedPuzzleIds || freshTeam.assignedPuzzleIds.length === 0) {
            return NextResponse.json({ status: 'loading' });
        }

        const puzzleId = freshTeam.assignedPuzzleIds[freshTeam.currentIndex];
        const puzzle = await Puzzle.findOne({ puzzleId });
        if (!puzzle) {
            return NextResponse.json({ status: 'loading' });
        }

        const isSolved = (freshTeam.solvedPuzzleIds || []).includes(puzzleId);

        return NextResponse.json({
            status: 'playing',
            timeLeft,
            penaltySeconds: freshTeam.penaltySeconds,
            currentIndex: freshTeam.currentIndex,
            totalPuzzles: freshTeam.assignedPuzzleIds.length,
            solvedCount: (freshTeam.solvedPuzzleIds || []).length,
            puzzle: {
                puzzleId: puzzle.puzzleId,
                type: puzzle.type,
                title: puzzle.title,
                prompt: puzzle.prompt,
                uiConfig: puzzle.uiConfig,
            },
            isSolved,
        });
    } catch (err) {
        console.error('Team state error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
