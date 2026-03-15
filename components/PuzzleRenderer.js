'use client';

import { useState } from 'react';

// Fallback for unknown/future puzzle types — plain text input
function FallbackPuzzle({ puzzle, onSubmit, submitting }) {
    const [val, setVal] = useState('');
    return (
        <div className="space-y-3">
            <div className="text-terminal-muted text-xs uppercase tracking-wider mb-2">Enter your answer:</div>
            <input
                type="text"
                className="terminal-input"
                placeholder="Type your answer..."
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSubmit(val.trim())}
            />
            <button
                onClick={() => val.trim() && onSubmit(val.trim())}
                disabled={!val.trim() || submitting}
                className="btn-primary w-full disabled:opacity-30"
            >
                {submitting ? 'SUBMITTING...' : '> SUBMIT ANSWER'}
            </button>
        </div>
    );
}

export default function PuzzleRenderer({ puzzle, onSubmit, submitting }) {
    if (!puzzle) return <div className="text-terminal-muted text-sm">No puzzle loaded.</div>;

    // We now just use the single string-input fallback for all dummy puzzles
    return <FallbackPuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
}
