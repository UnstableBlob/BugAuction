"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PuzzleRenderer from "@/components/PuzzleRenderer";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
});

function formatTime(seconds) {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function GamePage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef(null);

  const { data, error, mutate } = useSWR("/api/team/state", fetcher, { refreshInterval: 3000 });

  useEffect(() => {
    if (error && error.message === "Unauthorized") {
      router.push("/team/login");
      return;
    }
    if (data) {
      if (data.status === "success") {
        router.push("/team/success");
        return;
      }
      if (data.status === "caught") {
        router.push("/team/caught");
        return;
      }
      if (data.status === "ended") {
        router.push("/team/results");
        return;
      }
      if (data.status === "waiting") {
        router.push("/team/waiting");
        return;
      }
      if (data.status === "auctioning") {
        router.push("/team/auction");
        return;
      }
      // 'loading': puzzles not ready yet (late-join race condition) — stay and retry
      if (data.status === "loading") {
        return;
      }
      // Only set state when we have full game data
      if (data.status === "playing" && data.puzzle) {
        setState(data);
      }
    }
  }, [data, error, router]);

  // Auto-redirect when session ends or puzzle is missing
  useEffect(() => {
    if (state && !state.puzzle) {
      const timer = setTimeout(() => {
        router.push("/team/results");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  // Client-side count up between polls
  useEffect(() => {
    if (!state) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, timeSinceStart: (prev.timeSinceStart || 0) + 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state, router]);

  async function handleSubmit(answer) {
    if (!state || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/team/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId: state.puzzle.puzzleId, answer }),
      });
      const resData = await res.json();
      setMessage(resData.message || "");
      if (resData.allSolved) {
        router.push("/team/success");
        return;
      }
      mutate(); // refresh state after submit

    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function navigate(direction) {
    if (navigating) return;
    setNavigating(true);
    setMessage("");
    try {
      await fetch("/api/team/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      mutate();
    } catch {
      /* ignore */
    } finally {
      setNavigating(false);
    }
  }

  // ⚠️  DEBUG ONLY — remove before going live
  const [debugSolving, setDebugSolving] = useState(false);
  async function debugSolveAndNext() {
    if (debugSolving) return;
    setDebugSolving(true);
    setMessage("");
    try {
      const res = await fetch("/api/team/debug-solve", { method: "POST" });
      const data = await res.json();
      if (data.allSolved) {
        router.push("/team/success");
        return;
      }
      setMessage(data.message || "");
      mutate();
    } catch {
      setMessage("Debug solve failed.");
    } finally {
      setDebugSolving(false);
    }
  }




  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-terminal-green animate-pulse text-xl">
          LOADING MISSION DATA...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Top HUD */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="terminal-card text-center">
          <div className="text-terminal-muted text-xs uppercase tracking-wider mb-1">
            Time Elapsed
          </div>
          <div
            className={`text-2xl font-bold text-terminal-green`}
          >
            {formatTime(state.timeSinceStart)}
          </div>
        </div>
        <div className="terminal-card text-center">
          <div className="text-terminal-muted text-xs uppercase tracking-wider mb-1">
            Puzzle
          </div>
          <div className="text-terminal-green text-xl font-bold">
            {state.currentIndex + 1} / {state.totalPuzzles}
          </div>
        </div>
        <div className="terminal-card text-center">
          <div className="text-terminal-muted text-xs uppercase tracking-wider mb-1">
            Solved
          </div>
          <div className="text-terminal-green text-xl font-bold">
            {state.solvedCount} / {state.totalPuzzles}
          </div>
        </div>
      </div>

      {/* Puzzle Card */}
      <div className="terminal-card mb-4">
        {!state.puzzle ? (
          <div className="text-terminal-red text-sm text-center py-4">
            ⚠ Session ended. Redirecting...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-terminal-muted text-xs uppercase tracking-wider">
                ID:{" "}
                <span className="text-terminal-green">{state.puzzle.puzzleId}</span>
              </div>
              {state.isSolved && (
                <span className="text-terminal-green text-xs border border-terminal-green px-2 py-0.5 rounded">
                  ✓ SOLVED
                </span>
              )}
            </div>
            <h2 className="text-terminal-green text-xl font-bold mb-4">
              {state.puzzle.title}
            </h2>
            <p className="text-terminal-text text-sm mb-6 whitespace-pre-wrap leading-relaxed">
              {state.puzzle.prompt}
            </p>

            {/* Puzzle Renderer */}
            {!state.isSolved ? (
              <PuzzleRenderer
                key={state.puzzle.puzzleId}
                puzzle={state.puzzle}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            ) : (
              <div className="border border-terminal-green/30 rounded p-4 text-center text-terminal-green text-sm">
                ✓ You have already solved this puzzle. Navigate to the next one.
              </div>
            )}
          </>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 px-4 py-3 rounded border text-sm ${message.toLowerCase().includes("correct") ||
              message.toLowerCase().includes("solved")
              ? "border-terminal-green text-terminal-green bg-green-950/20"
              : "border-terminal-red text-terminal-red bg-red-950/20"
              }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* ⚠️  DEBUG BLOCK — remove before going live */}
      <div className="mb-4 border border-yellow-500/60 rounded p-3 bg-yellow-950/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-yellow-400 text-xs font-mono">⚠ DEBUG MODE</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={debugSolveAndNext}
            disabled={debugSolving}
            className="px-4 py-2 text-xs font-bold tracking-widest rounded border border-yellow-500 text-yellow-300 bg-yellow-900/30 hover:bg-yellow-800/40 transition-colors disabled:opacity-40"
          >
            {debugSolving ? "⏳ SOLVING..." : "⚡ NEXT + SOLVE"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => navigate("prev")}
          disabled={state.currentIndex === 0 || navigating}
          className="btn-primary disabled:opacity-30"
        >
          ← PREV
        </button>
        <span className="text-terminal-muted text-xs">
          {state.currentIndex + 1} of {state.totalPuzzles}
        </span>
        <button
          onClick={() => navigate("next")}
          disabled={state.currentIndex === state.totalPuzzles - 1 || navigating}
          className="btn-primary disabled:opacity-30"
        >
          NEXT →
        </button>
      </div>


    </main>
  );
}
