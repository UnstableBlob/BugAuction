"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

function formatTime(s) {
    if (s === null || s === undefined) return "--:--:--";
    if (s <= 0) return "00:00:00";
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

export default function AdminLeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState([]);
    const [session, setSession] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch("/api/admin/leaderboard");
            if (res.status === 401) {
                router.push("/admin/login");
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
            if (data.session) setSession(data.session);
            setLastUpdated(new Date());
        } catch {
            /* retry on next poll */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000);
        return () => clearInterval(interval);
    }, []);

    // Countdown timer — tick every second to decrement timeLeft
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setLeaderboard((prev) =>
                prev.map((t) => ({
                    ...t,
                    timeLeft: Math.max(0, (t.timeLeft || 0) - 1),
                }))
            );
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const solvedTeams = leaderboard.filter((t) => t.status === "success");
    const caughtTeams = leaderboard.filter((t) => t.status === "caught");
    const playingTeams = leaderboard.filter((t) => t.status === "playing");

    return (
        <main className="min-h-screen p-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div
                        className="text-terminal-amber text-2xl font-bold tracking-widest"
                        style={{ textShadow: "0 0 10px #ffb000" }}
                    >
                        PARAALLAX — LEADERBOARD
                    </div>
                    <div className="text-terminal-muted text-xs uppercase tracking-wider">
                        Live Rankings · Auto-refresh every 10s
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-terminal-muted text-xs animate-pulse">◌ LIVE</div>
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="btn-amber text-xs px-3 py-1"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            {/* Session Info Bar */}
            {session && (
                <div className="terminal-card mb-4 flex flex-wrap items-center gap-4 text-xs">
                    <div className="text-terminal-muted">
                        Session:{" "}
                        <span className="text-terminal-green font-bold">
                            {session._id?.toString().slice(-8)}
                        </span>
                    </div>
                    <div className="text-terminal-muted">
                        Status:{" "}
                        <span
                            className={
                                session.status === "started"
                                    ? "status-playing"
                                    : "status-inactive"
                            }
                        >
                            {session.status?.toUpperCase()}
                        </span>
                    </div>
                    <div className="text-terminal-muted">
                        Duration:{" "}
                        <span className="text-terminal-text">{session.durationMinutes}m</span>
                    </div>
                    <div className="text-terminal-muted">
                        Teams:{" "}
                        <span className="text-terminal-amber font-bold">
                            {leaderboard.length}
                        </span>
                    </div>
                    <div className="text-terminal-muted ml-auto">
                        ✓ Finished:{" "}
                        <span className="text-terminal-green font-bold">{solvedTeams.length}</span>
                        {" "}  |  Playing:{" "}
                        <span className="text-terminal-amber font-bold">{playingTeams.length}</span>
                        {" "}  |  Caught:{" "}
                        <span className="text-terminal-red font-bold">{caughtTeams.length}</span>
                    </div>
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="terminal-card">
                <div className="terminal-header flex items-center justify-between">
                    <span>Full Leaderboard</span>
                    {lastUpdated && (
                        <span className="text-terminal-muted text-xs font-normal">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="text-terminal-muted text-center py-8 animate-pulse">
                        Loading leaderboard data...
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-terminal-muted text-center py-8">
                        No teams in the current session yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-terminal-border text-terminal-muted text-xs">
                                    <th className="text-left px-3 py-3 font-normal">#</th>
                                    <th className="text-left px-3 py-3 font-normal">Team</th>
                                    <th className="text-left px-3 py-3 font-normal">Status</th>
                                    <th className="text-left px-3 py-3 font-normal">Solved</th>
                                    <th className="text-left px-3 py-3 font-normal">Penalty</th>
                                    <th className="text-left px-3 py-3 font-normal">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((t, idx) => (
                                    <tr
                                        key={t.teamName}
                                        className={`border-b border-terminal-border/30 transition-colors ${t.status === "success"
                                                ? "bg-green-950/25 hover:bg-green-950/35"
                                                : t.status === "caught"
                                                    ? "bg-red-950/15 hover:bg-red-950/25"
                                                    : "hover:bg-terminal-border/10"
                                            }`}
                                    >
                                        {/* Rank */}
                                        <td className="px-3 py-3 text-terminal-muted font-bold">
                                            {idx < 3 ? (
                                                <span className="text-lg">{RANK_EMOJIS[idx]}</span>
                                            ) : (
                                                <span className="text-terminal-muted">{idx + 1}</span>
                                            )}
                                        </td>

                                        {/* Team Name */}
                                        <td className="px-3 py-3 text-terminal-green font-bold text-sm">
                                            {t.teamName}
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-3">
                                            <span className={STATUS_COLORS[t.status] || "status-inactive"}>
                                                {t.status}
                                            </span>
                                        </td>

                                        {/* Solved */}
                                        <td className="px-3 py-3 text-terminal-text font-bold">
                                            <span
                                                className={
                                                    t.solvedCount === t.totalPuzzles && t.totalPuzzles > 0
                                                        ? "text-terminal-green"
                                                        : ""
                                                }
                                            >
                                                {t.solvedCount}
                                            </span>
                                            <span className="text-terminal-muted"> / {t.totalPuzzles}</span>
                                        </td>

                                        {/* Penalty */}
                                        <td className="px-3 py-3">
                                            {t.penaltySeconds ? (
                                                <span className="text-terminal-red">
                                                    -{Math.round(t.penaltySeconds / 60)}m
                                                </span>
                                            ) : (
                                                <span className="text-terminal-muted">—</span>
                                            )}
                                        </td>

                                        {/* Time */}
                                        <td
                                            className={`px-3 py-3 font-mono text-sm ${t.status === "success"
                                                    ? "text-terminal-green"
                                                    : (t.timeLeft || 0) > 300
                                                        ? "text-terminal-green"
                                                        : (t.timeLeft || 0) > 60
                                                            ? "text-terminal-amber"
                                                            : "text-terminal-red"
                                                }`}
                                        >
                                            {t.status === "success" && t.timeTaken
                                                ? formatTime(t.timeTaken)
                                                : t.status === "caught"
                                                    ? "CAUGHT"
                                                    : formatTime(t.timeLeft)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="text-terminal-muted text-xs text-center mt-4">
                Rankings: Most solved → Least penalty → Most time remaining
            </div>
        </main>
    );
}
