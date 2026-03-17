import fs from 'fs';
import path from 'path';

let cachedPuzzles = null;

export function getAllPuzzles() {
    if (cachedPuzzles) return cachedPuzzles;

    try {
        const filePath = path.join(process.cwd(), 'data', 'puzzles.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        cachedPuzzles = JSON.parse(fileData);
        return cachedPuzzles;
    } catch (error) {
        console.error('Error loading puzzles.json:', error);
        return [];
    }
}

export function getPuzzleById(puzzleId) {
    const puzzles = getAllPuzzles();
    return puzzles.find(p => p.puzzleId === puzzleId) || null;
}

export function checkAnswer(puzzleId, submittedAnswer) {
    const puzzle = getPuzzleById(puzzleId);
    if (!puzzle) return { correct: false, error: 'Puzzle not found' };

    const normalize = (v) => String(v).trim().toLowerCase();
    
    let isCorrect = false;
    if (typeof puzzle.answer === 'object' && puzzle.answer !== null) {
        isCorrect = normalize(JSON.stringify(puzzle.answer)) === normalize(JSON.stringify(submittedAnswer));
    } else {
        isCorrect = normalize(puzzle.answer) === normalize(submittedAnswer);
    }

    return { correct: isCorrect };
}
