import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import Team from '@/models/Team';
import { getPuzzleById } from '@/lib/puzzles';
import AnswerSubmission from '@/models/AnswerSubmission';

export async function POST(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (team.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });

        const { puzzleId, answer } = await req.json();
        if (!puzzleId || answer === undefined) {
            return NextResponse.json({ error: 'puzzleId and answer required' }, { status: 400 });
        }

        // Validate team owns this puzzle
        if (!team.assignedPuzzleIds.includes(puzzleId)) {
            return NextResponse.json({ error: 'Puzzle not assigned to your team' }, { status: 403 });
        }

        const puzzle = getPuzzleById(puzzleId);
        if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });

        const submissionTimestamp = new Date();

        // Persist every single submitted answer as an immutable audit record.
        await AnswerSubmission.create({
            teamId: team._id,
            teamName: team.teamName,
            sessionId: team.activeSessionId || null,
            puzzleId,
            answer,
            submittedAt: submissionTimestamp,
        });

        // Keep lightweight history on team doc for existing admin timeline/event-log flows.
        await Team.findByIdAndUpdate(team._id, {
            $push: {
                submissionHistory: {
                    puzzleId,
                    timestamp: submissionTimestamp,
                    isCorrect: null,
                    answer,
                }
            }
        });

        return NextResponse.json({
            recorded: true,
            message: 'Answer recorded.',
            puzzleId,
        });
    } catch (err) {
        console.error('Submit error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
