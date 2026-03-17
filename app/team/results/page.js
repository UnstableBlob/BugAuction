"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatTime(seconds) {
  if (seconds == null || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatCard({ label, value, sub, color = "text-terminal-green", border = "border-terminal-border" }) {
  return (
    <div className={`border ${border} rounded p-4 bg-black/40 flex flex-col items-center gap-1`}>
      <div className="text-terminal-muted text-xs uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-terminal-muted text-xs">{sub}</div>}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/team/results");
        if (res.status === 401) { router.push("/team/login"); return; }
        if (!res.ok) { setError("Could not load results."); setLoading(false); return; }
        const d = await res.json();
        setData(d);
        // Slight delay for dramatic effect
        setTimeout(() => setReveal(true), 300);
      } catch {
        setError("Network error. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-terminal-green animate-pulse text-xl tracking-widest">
          COMPILING RESULTS...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="terminal-card text-center max-w-md w-full">
          <div className="text-terminal-red text-lg mb-4">⚠ {error || "No data found."}</div>
          <button className="btn-primary" onClick={() => router.push("/team/login")}>
            ← Back to Login
          </button>
        </div>
      </main>
    );
  }

  const isCaught = data.status === "caught";
  const accentColor = isCaught ? "text-terminal-red" : "text-terminal-green";
  const borderColor = isCaught ? "border-terminal-red" : "border-terminal-green";
  const bgColor = isCaught ? "bg-red-950/20" : "bg-green-950/20";

  const accuracyBar = Math.min(100, data.accuracyPct || 0);
  const barFilled = Math.round(accuracyBar / 5); // out of 20 blocks
  const barEmpty = 20 - barFilled;

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className={`terminal-card text-center mb-6 border ${borderColor} ${bgColor} transition-all duration-700 ${reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionProperty: "opacity, transform" }}>

        {isCaught ? (
          <pre className="text-terminal-red text-xs leading-tight mb-4 overflow-x-auto" style={{ textShadow: "0 0 10px #ff3131" }}>{`
  ██████╗ ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗████████╗
 ██╔════╝██╔═══██╗██║   ██║██╔════╝ ██║  ██║╚══██╔══╝
 ██║     ███████║██║   ██║██║  ███╗███████║   ██║   
 ██║     ██╔══██║██║   ██║██║   ██║██╔══██║   ██║   
 ╚██████╗██║  ██║╚██████╔╝╚██████╔╝██║  ██║   ██║   
  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝  `}</pre>
        ) : (
          <pre className="text-terminal-green text-xs leading-tight mb-4 glow-text overflow-x-auto">{`
  ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗
 ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝
 ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗  
 ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝  
 ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝`}</pre>
        )}

        <div className={`text-xl font-bold ${accentColor} tracking-widest mb-1`}>
          {isCaught ? "✗ TIME EXPIRED — CAUGHT" : "✓ MISSION ACCOMPLISHED"}
        </div>
        <div className="text-terminal-muted text-xs">
          TEAM: <span className={`font-bold ${accentColor}`}>{data.teamName}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 transition-all duration-700 delay-100 ${reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionProperty: "opacity, transform" }}>
        <StatCard
          label="Puzzles Solved"
          value={`${data.solvedCount} / ${data.totalPuzzles}`}
          sub="completed"
          color="text-terminal-green"
          border="border-terminal-green/40"
        />
        <StatCard
          label="Accuracy"
          value={`${data.accuracyPct}%`}
          sub="solve rate"
          color={data.accuracyPct >= 70 ? "text-terminal-green" : data.accuracyPct >= 40 ? "text-terminal-amber" : "text-terminal-red"}
          border={data.accuracyPct >= 70 ? "border-terminal-green/40" : "border-terminal-amber/40"}
        />

        <StatCard
          label="Time Taken"
          value={formatTime(data.timeTakenSeconds)}
          sub="from game start"
          color="text-terminal-amber"
          border="border-terminal-amber/40"
        />
      </div>

      {/* Accuracy progress bar */}
      <div className={`terminal-card mb-6 transition-all duration-700 delay-200 ${reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionProperty: "opacity, transform" }}>
        <div className="text-terminal-muted text-xs uppercase tracking-widest mb-3">Performance</div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-terminal-muted text-xs w-24">Accuracy</span>
          <code className={`font-mono text-sm ${accentColor}`}>
            {"█".repeat(barFilled)}{"░".repeat(barEmpty)}
          </code>
          <span className={`text-sm font-bold ${accentColor}`}>{data.accuracyPct}%</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-terminal-muted text-xs w-24">Solved</span>
          <code className="font-mono text-sm text-terminal-green">
            {"█".repeat(Math.round((data.solvedCount / Math.max(data.totalPuzzles, 1)) * 20))}
            {"░".repeat(20 - Math.round((data.solvedCount / Math.max(data.totalPuzzles, 1)) * 20))}
          </code>
          <span className="text-sm font-bold text-terminal-green">{data.solvedCount}/{data.totalPuzzles}</span>
        </div>
      </div>

      {/* Puzzle breakdown */}
      {data.puzzleDetails && data.puzzleDetails.length > 0 && (
        <div className={`terminal-card mb-6 transition-all duration-700 delay-300 ${reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionProperty: "opacity, transform" }}>
          <div className="text-terminal-muted text-xs uppercase tracking-widest mb-4">Puzzle Breakdown</div>
          <div className="space-y-2">
            {data.puzzleDetails.map((p) => (
              <div
                key={p.puzzleId}
                className={`flex items-center justify-between px-3 py-2 rounded border text-sm
                  ${p.solved
                    ? "border-terminal-green/30 bg-green-950/10"
                    : "border-terminal-red/30 bg-red-950/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono ${p.solved ? "text-terminal-green" : "text-terminal-red"}`}>
                    {p.solved ? "✓" : "✗"}
                  </span>
                  <span className="text-terminal-muted text-xs">#{p.index}</span>
                  <span className={p.solved ? "text-terminal-text" : "text-terminal-muted"}>
                    {p.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-terminal-muted text-xs font-mono uppercase">{p.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold
                    ${p.solved
                      ? "text-terminal-green border-terminal-green/40"
                      : "text-terminal-red border-terminal-red/40"
                    }`}>
                    {p.solved ? "SOLVED" : "UNSOLVED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary footer */}
      <div className={`terminal-card text-center transition-all duration-700 delay-500 ${reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionProperty: "opacity, transform" }}>
        <div className="text-terminal-muted text-xs space-y-1 mb-4">
          <div>► Your results have been recorded</div>
          <div>► Notify the invigilator and show this screen</div>
          <div>► Do NOT close this tab</div>
        </div>
        <div className={`text-xs ${accentColor} animate-pulse`}>
          {isCaught ? "▸ ACCESS TERMINATED ◂" : "▸ SYSTEM BREACH CONFIRMED ◂"}
        </div>
      </div>
    </main>
  );
}
