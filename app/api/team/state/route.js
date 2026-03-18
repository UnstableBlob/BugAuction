import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import Team from '@/models/Team';
import Auction from '@/models/Auction';
import { getCache, setCache } from '@/lib/cache';
import { getPowercardById } from '@/lib/powercards';
import { getPuzzleById } from '@/lib/puzzles';

export async function GET(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Re-fetch team from DB to get latest fields
        const freshTeam = await Team.findById(team._id).lean();

        // Always return 'auctioning' if they are in the auctioning state.
        if (freshTeam.status === 'auctioning') {
            return NextResponse.json({ 
              status: 'auctioning',
              currency: freshTeam.currency || 0,
              assignedPowercardIds: freshTeam.assignedPowercardIds || []
            });
        }

        // ── Terminal states ──────────────────────────────────────────────────────
        if (freshTeam.status === 'success') return NextResponse.json({ status: 'success' });
        if (freshTeam.status === 'caught') return NextResponse.json({ status: 'caught' });

        if (freshTeam.status !== 'playing') {
            return NextResponse.json({ status: freshTeam.status });
        }

        // ── Playing state ────────────────────────────────────────────────────────
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

        // Check for active auctions
        const openAuction = await Auction.findOne({ sessionId: session._id, status: "open" }).lean();
        const hasActiveAuction = !!openAuction;
        const hasBidInActiveAuction = openAuction ? openAuction.bids.some(b => b.teamId.toString() === freshTeam._id.toString()) : false;

        // Guard against empty assignedPuzzleIds (race condition on first poll)
        if (!freshTeam.assignedPuzzleIds || freshTeam.assignedPuzzleIds.length === 0) {
            return NextResponse.json({ 
                status: 'loading',
                currency: freshTeam.currency || 0,
                assignedPowercardIds: freshTeam.assignedPowercardIds || []
            });
        }

        const puzzleId = freshTeam.assignedPuzzleIds[freshTeam.currentIndex];
        const puzzle = getPuzzleById(puzzleId);
        
        if (!puzzle) {
            return NextResponse.json({ 
                status: 'loading',
                currency: freshTeam.currency || 0,
                assignedPowercardIds: freshTeam.assignedPowercardIds || []
            });
        }

        const isSolved = (freshTeam.solvedPuzzleIds || []).includes(puzzleId);

        // Resolve powercards
        const ownedPowercards = (freshTeam.assignedPowercardIds || []).map(id => getPowercardById(id)).filter(Boolean);

        return NextResponse.json({
            status: 'playing',
            timeSinceStart,
            hasActiveAuction,
            hasBidInActiveAuction,
            currentIndex: freshTeam.currentIndex,
            totalPuzzles: freshTeam.assignedPuzzleIds.length,
            solvedCount: (freshTeam.solvedPuzzleIds || []).length,
            score: freshTeam.score || 0,
            currency: freshTeam.currency || 0,
            ownedPowercards,
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
