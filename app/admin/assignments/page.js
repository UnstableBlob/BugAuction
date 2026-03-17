"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("API error");
  return res.json();
});

export default function PuzzleAssignments() {
  const router = useRouter();
  const { data, error, mutate } = useSWR("/api/admin/puzzles/assignments", fetcher);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedTeams, setSelectedTeams] = useState({});

  if (error) return <div className="p-10 text-red-500">Failed to load puzzle assignments</div>;
  if (!data) return <div className="p-10 text-terminal-amber animate-pulse">Loading Mission Data...</div>;

  const { puzzles, allTeams } = data;

  async function handleAssign(puzzleId) {
    const teamId = selectedTeams[puzzleId];
    if (!teamId) {
      setMsg("Error: Please select a team first");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/puzzles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, teamId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMsg("Error: " + result.error);
      } else {
        setMsg(`✓ Puzzle assigned to ${result.teamName}`);
        mutate(); // Refresh the data
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

  const handleSelectChange = (puzzleId, teamId) => {
    setSelectedTeams(prev => ({ ...prev, [puzzleId]: teamId }));
  };

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="text-terminal-amber text-2xl font-bold tracking-widest cursor-pointer"
            style={{ textShadow: "0 0 10px #ffb000" }}
            onClick={() => router.push("/admin/dashboard")}
          >
            PARAALLAX — ADMIN
          </div>
          <div className="text-terminal-muted text-xs uppercase tracking-wider">
            Puzzle Assignments Panel
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="btn-amber text-xs px-3 py-1"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* Message Banner */}
      {msg && (
        <div
          className={`px-4 py-2 mb-6 rounded border text-xs ${msg.startsWith("✓")
            ? "border-terminal-green text-terminal-green bg-green-950/20"
            : "border-terminal-red text-terminal-red bg-red-950/20"
            }`}
        >
          {msg}
        </div>
      )}

      {/* Main Table */}
      <div className="terminal-card">
        <div className="terminal-header">Puzzle Assignments</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terminal-border text-terminal-muted">
                <th className="text-left px-4 py-3 font-normal">Puzzle Title (ID)</th>
                <th className="text-left px-4 py-3 font-normal">Assigned Teams</th>
                <th className="text-left px-4 py-3 font-normal">Add Assignment</th>
              </tr>
            </thead>
            <tbody>
              {puzzles.map((puzzle) => (
                <tr
                  key={puzzle.puzzleId}
                  className="border-b border-terminal-border/30 hover:bg-terminal-border/10 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="text-terminal-amber font-bold">{puzzle.title}</div>
                    <div className="text-terminal-muted text-xs">{puzzle.puzzleId}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {puzzle.assignedTeams && puzzle.assignedTeams.length > 0 ? (
                        puzzle.assignedTeams.map((team) => (
                          <span
                            key={team._id}
                            className="bg-terminal-green/10 border border-terminal-green/30 text-terminal-green px-2 py-0.5 rounded text-xs"
                          >
                            {team.teamName}
                          </span>
                        ))
                      ) : (
                        <span className="text-terminal-muted italic text-xs">No teams assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex gap-2">
                      <select
                        className="terminal-input bg-black text-xs py-1"
                        value={selectedTeams[puzzle.puzzleId] || ""}
                        onChange={(e) => handleSelectChange(puzzle.puzzleId, e.target.value)}
                      >
                        <option value="">-- Choose Team --</option>
                        {allTeams.map(team => (
                          <option key={team._id} value={team._id}>{team.teamName}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(puzzle.puzzleId)}
                        disabled={loading}
                        className="btn-amber text-xs px-3 py-1 whitespace-nowrap"
                      >
                        {loading ? "..." : "Assign"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
