"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("API error");
  return res.json();
});

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

export default function AdminDashboard() {
  const router = useRouter();
  
  // Use SWR for polling 
  const { data: teamsData, mutate: mutateTeams } = useSWR("/api/admin/teams", fetcher, { refreshInterval: 5000 });
  const { data: lbData, mutate: mutateLb } = useSWR("/api/admin/leaderboard", fetcher, { refreshInterval: 5000 });
  const { data: auctionData, mutate: mutateAuction } = useSWR("/api/admin/auction/current", fetcher, { refreshInterval: 5000 });
  const { data: puzzlesData } = useSWR("/api/admin/puzzles", fetcher);

  const teams = teamsData?.teams || [];
  const allPuzzles = puzzlesData?.puzzles || [];
  const activeAuction = auctionData?.auction || null;
  const session = lbData?.session || null;

  const [leaderboard, setLeaderboard] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedTeamNames, setSelectedTeamNames] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const [eventLog, setEventLog] = useState([]);
  const [sessionTimer, setSessionTimer] = useState(null);

  const [auctionPuzzleId, setAuctionPuzzleId] = useState("");

  const refreshAll = () => {
    mutateTeams();
    mutateLb();
    mutateAuction();
  };

  useEffect(() => {
    if (lbData?.leaderboard) {
      setLeaderboard(lbData.leaderboard);
    }
  }, [lbData]);

  // ensure event log interval cleaned
  useEffect(() => {
    const eventInterval = setInterval(() => {
      if (session && session._id) fetchEventLog(session._id);
      else fetchEventLog();
    }, 3000);
    return () => clearInterval(eventInterval);
  }, [session]);

  // Client-side countdown timer for time left
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeaderboard((prev) =>
        prev.map((t) => {
          if (t.status === "success") return t;
          return {
            ...t,
            timeTaken: (t.timeTaken || 0) + 1,
          };
        }),
      );
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // fetch event log for admin terminal
  async function fetchEventLog(sessionId) {
    try {
      const url = sessionId ? `/api/admin/session/event-log?sessionId=${sessionId}` : '/api/admin/session/event-log';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // session might be null (before start) so explicitly update
      if ('session' in data) setSession(data.session);
      if (Array.isArray(data.eventLog)) setEventLog(data.eventLog);
    } catch (e) {
      // ignore
    }
  }

  async function startSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch('/api/admin/session/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to start'));
      else {
        setMsg('✓ Session started');
        fetchEventLog(data.sessionId);
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }

  async function stopSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const body = { sessionId: session && session.id ? session.id : session && session._id };
      const res = await fetch('/api/admin/session/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to stop'));
      else {
        setMsg('✓ Session stopped');
        fetchEventLog(body.sessionId);
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }

  async function clearSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const body = { sessionId: session && session.id ? session.id : session && session._id };
      const res = await fetch('/api/admin/session/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to clear'));
      else {
        setMsg('✓ Cleared teams and sessions');
        // refresh
        setSession(null);
        setEventLog([]);
        refreshAll();
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }



  // ==== Auction Logic ====
  async function startAuction() {
    if (!session || !session._id) {
       setMsg("Error: Start a session first before auctioning.");
       return;
    }
    if (!auctionPuzzleId) {
      setMsg("Error: Select a puzzle to auction.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/auction/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session._id,
          puzzleId: auctionPuzzleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setMsg("✓ Auction started");
        refreshAll();
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

  async function closeAuction() {
    if (!activeAuction) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/auction/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: activeAuction._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setMsg("✓ Auction closed");
        refreshAll();
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

  async function startGamePhase() {
    if (!session || !session._id) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/session/start-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setMsg("✓ Game Phase Started");
        refreshAll();
      }
    } catch {
      setMsg("Network error");
    }
    setLoading(false);
  }

  const playingTeams = teams.filter((t) =>
    ["playing", "success", "caught"].includes(t.status),
  );

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="text-terminal-amber text-2xl font-bold tracking-widest"
            style={{ textShadow: "0 0 10px #ffb000" }}
          >
            PARAALLAX — ADMIN
          </div>
          <div className="text-terminal-muted text-xs uppercase tracking-wider">
            Control Panel · Polling every 5s
          </div>
          <div className="text-terminal-amber text-sm font-bold mt-1">
            PHASE: {session && session.status === 'started' ? (playingTeams.length > 0 ? 'PLAYING PHASE' : 'AUCTIONING PHASE') : 'REGISTRATION PHASE'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <button
              onClick={() => router.push("/admin/leaderboard")}
              className="btn-amber text-xs px-3 py-1"
            >
              📊 View Leaderboard
            </button>
          )}
          <div className="text-terminal-muted text-xs animate-pulse">◌ LIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Team Selection + Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Session Controls */}
          <div className="terminal-card space-y-3">
            <div className="terminal-header">Session Controls</div>
            <button onClick={startSession} disabled={loading} className="btn-amber w-full disabled:opacity-30">{loading ? "PROCESSING..." : "▶ INIT AUCTIONING PHASE"}</button>
            <div className="text-terminal-muted text-xs mt-2">Active session: {session && (session.id || session._id) ? (session.id || session._id).toString().slice(-8) : 'none'}</div>
            <div className="mt-2">
              <button onClick={startGamePhase} disabled={loading || !session || session.status !== 'started'} className="btn-amber w-full border-green-500 !text-green-500 disabled:opacity-30">
                {loading ? "PROCESSING..." : "▶ START PLAYING PHASE"}
              </button>
            </div>
            <div className="mt-2">
              <button onClick={stopSession} disabled={loading || !session || session.status !== 'started'} className="btn-primary w-full disabled:opacity-30">
                {loading ? "PROCESSING..." : "STOP SESSION"}
              </button>
            </div>
            <div className="mt-2">
              <button onClick={clearSession} disabled={loading} className="btn-amber w-full disabled:opacity-30">
                {loading ? "PROCESSING..." : "CLEAR TEAMS & SESSIONS"}
              </button>
            </div>
          </div>

          {/* Auction Management */}
          <div className="terminal-card space-y-3 border-amber-500/50">
            <div className="terminal-header text-amber-500">Auction Management</div>
            <div className="text-terminal-muted text-xs mb-2">
               Manage silent auctions for puzzles. Requires an active session.
            </div>
            {!activeAuction ? (
              <>
                 <label className="text-terminal-muted text-xs block mb-1">Select Puzzle</label>
                 <select 
                    value={auctionPuzzleId} 
                    onChange={(e) => setAuctionPuzzleId(e.target.value)}
                    className="terminal-input w-full bg-black mb-2"
                 >
                    <option value="">-- Choose Priority Puzzle --</option>
                    {allPuzzles.map(p => (
                       <option key={p.puzzleId} value={p.puzzleId}>
                          {p.title} ({p.puzzleId})
                       </option>
                    ))}
                 </select>
                 <button 
                    onClick={startAuction} 
                    disabled={loading || !session || session.status !== 'started'} 
                    className="btn-amber w-full disabled:opacity-30"
                 >
                    {loading ? "PROCESSING..." : "BIDDING: OPEN AUCTION"}
                 </button>
              </>
            ) : (
               <>
                 <div className="p-2 border border-terminal-green/30 bg-green-950/20 mb-2 rounded">
                    <div className="text-terminal-amber font-bold text-sm mb-1">
                       Active: {allPuzzles.find(p => p.puzzleId === activeAuction.puzzleId)?.title || activeAuction.puzzleId}
                    </div>
                    <div className="text-terminal-muted text-xs mb-1">
                       Bids received: {activeAuction.bids?.length || 0}
                    </div>
                    {activeAuction.bids && activeAuction.bids.length > 0 && (
                      <div className="text-terminal-green text-xs font-bold">
                         Top bid so far: {Math.max(...activeAuction.bids.map(b => b.amount))}
                      </div>
                    )}
                 </div>
                 <button 
                    onClick={closeAuction} 
                    disabled={loading} 
                    className="btn-primary w-full disabled:opacity-30 !bg-red-900 !text-white hover:!bg-red-800"
                 >
                    {loading ? "PROCESSING..." : "CLOSE AUCTION & AWARD PUZZLE"}
                 </button>
               </>
            )}
          </div>

          {/* Live Event Terminal */}
          <div className="terminal-card">
            <div className="terminal-header">Event Terminal</div>
            <div className="text-terminal-muted text-xs mb-2">Live log of bids and answer attempts</div>
            <div className="max-h-64 overflow-y-auto text-xs space-y-2">
              {eventLog.length === 0 ? (
                 <div className="text-terminal-muted">No events yet...</div>
              ) : (
                eventLog.map((e, i) => (
                  <div key={i} className="flex flex-col border-b border-terminal-border/20 pb-1">
                    <div className="flex justify-between w-full">
                       <span className="text-terminal-green font-bold">{e.teamName}</span>
                       <span className="text-terminal-muted">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={
                       e.type === 'solve' ? 'text-green-400 font-bold' :
                       e.type === 'submit' ? 'text-red-400 font-bold' :
                       e.type === 'bid' ? 'text-amber-400 font-bold' : 
                       e.type === 'phase' ? 'text-blue-400 font-bold' : 'text-terminal-text font-bold'
                    }>
                       [{e.type.toUpperCase()}] {e.detail}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`px-4 py-2 rounded border text-xs ${msg.startsWith("✓")
                ? "border-terminal-green text-terminal-green bg-green-950/20"
                : "border-terminal-red text-terminal-red bg-red-950/20"
                }`}
            >
              {msg}
            </div>
          )}

          {/* Past Sessions — link to dedicated page */}
          <div className="terminal-card">
            <div className="terminal-header">Past Sessions</div>
            <p className="text-terminal-muted text-xs mb-3">
              View archived leaderboards from all previous events.
            </p>
            <button
              onClick={() => router.push("/admin/past-sessions")}
              className="btn-amber w-full"
            >
              📁 View Past Sessions
            </button>
          </div>

        </div>

        {/* RIGHT: Status + Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* All Teams Status */}
          <div className="terminal-card">
            <div className="terminal-header">All Teams Status</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-terminal-border text-terminal-muted">
                    <th className="text-left px-2 py-2 font-normal">
                      Team Name
                    </th>
                    <th className="text-left px-2 py-2 font-normal">Status</th>
                    <th className="text-left px-2 py-2 font-normal">Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr
                      key={t.teamName}
                      className="border-b border-terminal-border/30 hover:bg-terminal-border/10"
                    >
                      <td className="px-2 py-2 text-terminal-green font-bold">
                        {t.teamName}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            STATUS_COLORS[t.status] || "status-inactive"
                          }
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-terminal-text">
                        {t.solvedPuzzleIds?.length || 0} /{" "}
                        {t.assignedPuzzleIds?.length || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="terminal-card">
              <div className="terminal-header">Leaderboard</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-terminal-border text-terminal-muted">
                      <th className="text-left px-2 py-2 font-normal">#</th>
                      <th className="text-left px-2 py-2 font-normal">Team</th>
                      <th className="text-left px-2 py-2 font-normal">
                        Status
                      </th>
                      <th className="text-left px-2 py-2 font-normal">
                        Solved
                      </th>
                      <th className="text-left px-2 py-2 font-normal">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((t, idx) => (
                      <tr
                        key={t.teamName}
                        className={`border-b border-terminal-border/30 ${t.status === "success"
                          ? "bg-green-950/20"
                          : t.status === "caught"
                            ? "bg-red-950/10"
                            : ""
                          }`}
                      >
                        <td className="px-2 py-2 text-terminal-muted">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-2 text-terminal-green font-bold">
                          {t.teamName}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={
                              STATUS_COLORS[t.status] || "status-inactive"
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-terminal-text font-bold">
                          {t.solvedCount} / {t.totalPuzzles}
                        </td>
                        <td
                          className={`px-2 py-2 font-mono ${t.status === "success"
                            ? "text-terminal-green"
                            : "text-terminal-text"
                            }`}
                        >
                          {formatTime(t.timeTaken)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>



    </main>
  );
}
