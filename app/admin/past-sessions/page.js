"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatTime(s) {
    if (s === null || s === undefined || s <= 0) return "—";
    const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

const STATUS_COLORS = {
    inactive: "status-inactive",
    waiting: "status-waiting",
    playing: "status-playing",
    success: "status-success",
    caught: "status-caught",
};

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export default function PastSessionsPage() {
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIdx, setExpandedIdx] = useState(0); // first session expanded by default
    const [clearing, setClearing] = useState(false);
    const [clearMsg, setClearMsg] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/admin/session/history");
                if (res.status === 401) {
                    router.push("/admin/login");
                    return;
                }
                if (!res.ok) return;
                const data = await res.json();
                setHistory(data.history || []);
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [router]);

    async function clearHistory() {
        if (!window.confirm("Delete ALL past session records permanently? This cannot be undone.")) return;
        setClearing(true);
        setClearMsg("");
        try {
            const res = await fetch("/api/admin/session/history", { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                setClearMsg("Error: " + (data.error || "Failed to clear"));
            } else {
                setHistory([]);
                setClearMsg(`✓ Cleared ${data.deleted} session record(s)`);
            }
        } catch {
            setClearMsg("Network error");
        }
        setClearing(false);
    }

    return (
        <main className="min-h-screen p-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div
                        className="text-terminal-amber text-2xl font-bold tracking-widest"
                        style={{ textShadow: "0 0 10px #ffb000" }}
                    >
                        PARAALLAX — PAST SESSIONS
                    </div>
                    <div className="text-terminal-muted text-xs uppercase tracking-wider">
                        Historical Records · {history.length} session{history.length !== 1 ? "s" : ""} archived
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            disabled={clearing}
                            className="text-xs px-3 py-1 rounded border border-terminal-red text-terminal-red hover:bg-red-950/30 disabled:opacity-40 transition-colors"
                        >
                            {clearing ? "Clearing..." : "🗑 Clear Past Sessions"}
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="btn-amber text-xs px-3 py-1"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            {/* Clear message */}
            {clearMsg && (
                <div
                    className={`mb-4 px-4 py-2 rounded border text-xs ${clearMsg.startsWith("✓")
                            ? "border-terminal-green text-terminal-green bg-green-950/20"
                            : "border-terminal-red text-terminal-red bg-red-950/20"
                        }`}
                >
                    {clearMsg}
                </div>
            )}

            {loading ? (
                <div className="terminal-card text-terminal-muted text-center py-12 animate-pulse">
                    Loading session history...
                </div>
            ) : history.length === 0 ? (
                <div className="terminal-card text-center py-12">
                    <div className="text-terminal-muted text-lg mb-2">📭 No past sessions yet</div>
                    <div className="text-terminal-muted text-xs">
                        Past sessions appear here after you click &quot;Clear Teams &amp; Sessions&quot; on the dashboard.
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((h, idx) => {
                        const isOpen = expandedIdx === idx;
                        const lb = h.leaderboard || [];
                        const finished = lb.filter((t) => t.status === "success").length;
                        const caught = lb.filter((t) => t.status === "caught").length;
                        const playing = lb.filter((t) => t.status === "playing").length;
                        const sessionNum = history.length - idx;

                        return (
                            <div key={h._id || idx} className="terminal-card">
                                {/* Session Header — clickable to expand/collapse */}
                                <button
                                    className="w-full text-left"
                                    onClick={() => setExpandedIdx(isOpen ? -1 : idx)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="text-terminal-amber font-bold text-sm tracking-widest"
                                                style={{ textShadow: "0 0 6px #ffb000" }}
                                            >
                                                SESSION #{sessionNum}
                                            </span>
                                            <span className="text-terminal-muted text-xs">
                                                {h.sessionStartedAt
                                                    ? new Date(h.sessionStartedAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </span>
                                            <span className="text-terminal-muted text-xs">
                                                {h.sessionStartedAt
                                                    ? new Date(h.sessionStartedAt).toLocaleTimeString()
                                                    : "—"}
                                            </span>
                                        </div>
                                        <span className="text-terminal-muted text-xs">{isOpen ? "▲" : "▼"}</span>
                                    </div>

                                    {/* Quick stats bar */}
                                    <div className="flex flex-wrap gap-4 mt-2 text-xs">

                                        <span className="text-terminal-muted">
                                            Teams:{" "}
                                            <span className="text-terminal-amber font-bold">{lb.length}</span>
                                        </span>
                                        <span className="text-terminal-muted">
                                            ✓ Finished:{" "}
                                            <span className="text-terminal-green font-bold">{finished}</span>
                                        </span>
                                        <span className="text-terminal-muted">
                                            ✗ Caught:{" "}
                                            <span className="text-terminal-red font-bold">{caught}</span>
                                        </span>
                                        {playing > 0 && (
                                            <span className="text-terminal-muted">
                                                ⏳ Still Playing:{" "}
                                                <span className="text-terminal-amber font-bold">{playing}</span>
                                            </span>
                                        )}
                                        <span className="text-terminal-muted ml-auto">
                                            Cleared:{" "}
                                            <span className="text-terminal-muted">
                                                {h.clearedAt ? new Date(h.clearedAt).toLocaleString() : "—"}
                                            </span>
                                        </span>
                                    </div>
                                </button>

                                {/* Expanded leaderboard */}
                                {isOpen && (
                                    <div className="mt-4 border-t border-terminal-border/30 pt-4">
                                        {lb.length === 0 ? (
                                            <p className="text-terminal-muted text-xs text-center py-4">
                                                No team data recorded for this session.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-terminal-border text-terminal-muted text-xs">
                                                            <th className="text-left px-3 py-2 font-normal">Rank</th>
                                                            <th className="text-left px-3 py-2 font-normal">Team</th>
                                                            <th className="text-left px-3 py-2 font-normal">Status</th>
                                                            <th className="text-left px-3 py-2 font-normal">Solved</th>
                                                            <th className="text-left px-3 py-2 font-normal">Time Taken</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {lb.map((entry) => (
                                                            <tr
                                                                key={entry.teamName}
                                                                className={`border-b border-terminal-border/20 transition-colors ${entry.status === "success"
                                                                    ? "bg-green-950/20 hover:bg-green-950/30"
                                                                    : entry.status === "caught"
                                                                        ? "bg-red-950/10 hover:bg-red-950/20"
                                                                        : "hover:bg-terminal-border/10"
                                                                    }`}
                                                            >
                                                                {/* Rank */}
                                                                <td className="px-3 py-2">
                                                                    {entry.rank <= 3 ? (
                                                                        <span className="text-lg">{RANK_EMOJIS[(entry.rank || 1) - 1]}</span>
                                                                    ) : (
                                                                        <span className="text-terminal-muted font-bold">#{entry.rank}</span>
                                                                    )}
                                                                </td>

                                                                {/* Team */}
                                                                <td className="px-3 py-2 text-terminal-green font-bold">
                                                                    {entry.teamName}
                                                                </td>

                                                                {/* Status */}
                                                                <td className="px-3 py-2">
                                                                    <span className={STATUS_COLORS[entry.status] || "status-inactive"}>
                                                                        {entry.status || "—"}
                                                                    </span>
                                                                </td>

                                                                {/* Solved */}
                                                                <td className="px-3 py-2 font-bold">
                                                                    <span
                                                                        className={
                                                                            entry.solvedCount === entry.totalPuzzles && entry.totalPuzzles > 0
                                                                                ? "text-terminal-green"
                                                                                : "text-terminal-text"
                                                                        }
                                                                    >
                                                                        {entry.solvedCount}
                                                                    </span>
                                                                    <span className="text-terminal-muted"> / {entry.totalPuzzles}</span>
                                                                </td>



                                                                {/* Time taken */}
                                                                <td className="px-3 py-2 font-mono">
                                                                    {entry.status === "success" && entry.timeTaken ? (
                                                                        <span className="text-terminal-green">
                                                                            {formatTime(entry.timeTaken)}
                                                                        </span>
                                                                    ) : entry.status === "caught" ? (
                                                                        <span className="text-terminal-red">CAUGHT</span>
                                                                    ) : (
                                                                        <span className="text-terminal-muted">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {history.length > 0 && (
                <div className="text-terminal-muted text-xs text-center mt-4">
                    Rankings: Most solved → Fastest finish
                </div>
            )}
        </main>
    );
}
