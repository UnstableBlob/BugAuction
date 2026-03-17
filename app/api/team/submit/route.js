import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Team from '@/models/Team';
import Puzzle from '@/models/Puzzle';

function answersMatch(correctAnswer, submittedAnswer) {
    const normalize = (v) => String(v).trim().toLowerCase();
    if (typeof correctAnswer === 'object' && correctAnswer !== null) {
        return normalize(JSON.stringify(correctAnswer)) === normalize(JSON.stringify(submittedAnswer));
    }
    return normalize(correctAnswer) === normalize(submittedAnswer);
}

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

        await connectDB();
        const puzzle = await Puzzle.findOne({ puzzleId });
        if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });

        // Already solved?
        if (team.solvedPuzzleIds.includes(puzzleId)) {
            return NextResponse.json({ correct: true, message: 'Already solved!', alreadySolved: true });
        }

        const isCorrect = answersMatch(puzzle.answer, answer);

        if (isCorrect) {
            const newSolved = [...team.solvedPuzzleIds, puzzleId];
            const allSolved = newSolved.length >= team.assignedPuzzleIds.length;
            let dbUpdate = {
                solvedPuzzleIds: newSolved,
                status: allSolved ? 'success' : 'playing',
                $push: {
                    submissionHistory: {
                        puzzleId,
                        timestamp: new Date(),
                        isCorrect: true,
                        answer: answer,
                    }
                }
            };
            if (allSolved) {
                dbUpdate.finishTime = new Date();
            }
            await Team.findByIdAndUpdate(team._id, dbUpdate);
            return NextResponse.json({
                correct: true,
                message: allSolved ? 'All puzzles solved! Mission complete.' : 'Correct! Puzzle unlocked.',
                allSolved,
                solvedCount: newSolved.length,
            });
        } else {
            await Team.findByIdAndUpdate(team._id, {
                $push: {
                    submissionHistory: {
                        puzzleId,
                        timestamp: new Date(),
                        isCorrect: false,
                        answer: answer,
                    }
                }
            });

            return NextResponse.json({
                correct: false,
                message: `Wrong answer! Try again.`,
            });
        }
    } catch (err) {
        console.error('Submit error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
