import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import Team from '@/models/Team';
import { getCache, setCache } from '@/lib/cache';
import { getPuzzleById } from '@/lib/puzzles';

export async function GET(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Always return 'auctioning' if they are in the auctioning state.
        if (team.status === 'auctioning') {
            return NextResponse.json({ status: 'auctioning' });
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
        if (freshTeam.activeSessionId) {
            const cacheKey = `session_${freshTeam.activeSessionId}`;
            session = getCache(cacheKey);
            if (!session) {
                session = await Session.findById(freshTeam.activeSessionId).lean();
                if (session) setCache(cacheKey, session, 2);
            }
        }
        if (!session) {
            session = getCache('activeSession');
            if (!session) {
                session = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 }).lean();
                if (session) setCache('activeSession', session, 2);
            }
        }
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

        // If session has ended, redirect to results
        if (session.status === 'ended') {
            return NextResponse.json({ status: 'ended', shouldRedirect: '/team/results' });
        }

        // Calculate time since start
        const now = Date.now();
        const timeSinceStart = Math.floor((now - new Date(session.startedAt).getTime()) / 1000);

        // Guard against empty assignedPuzzleIds (race condition on first poll)
        if (!freshTeam.assignedPuzzleIds || freshTeam.assignedPuzzleIds.length === 0) {
            return NextResponse.json({ status: 'loading' });
        }

        const puzzleId = freshTeam.assignedPuzzleIds[freshTeam.currentIndex];
        const puzzle = getPuzzleById(puzzleId);
        
        if (!puzzle) {
            return NextResponse.json({ status: 'loading' });
        }

        const isSolved = (freshTeam.solvedPuzzleIds || []).includes(puzzleId);

        return NextResponse.json({
            status: 'playing',
            timeSinceStart,
            currentIndex: freshTeam.currentIndex,
            totalPuzzles: freshTeam.assignedPuzzleIds.length,
            solvedCount: (freshTeam.solvedPuzzleIds || []).length,
            score: freshTeam.score || 0,
            puzzle: {
                puzzleId: puzzle.puzzleId,
                type: puzzle.type,
                title: puzzle.title,
                prompt: puzzle.prompt,
                points: puzzle.points,
                uiConfig: puzzle.uiConfig,
            },
            isSolved,
        });
    } catch (err) {
        console.error('Team state error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
