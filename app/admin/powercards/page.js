"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("API error");
  return res.json();
});

export default function PowercardAssignments() {
  const router = useRouter();
  const { data, error, mutate } = useSWR("/api/admin/powercards/assignments", fetcher);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedTeams, setSelectedTeams] = useState({});

  if (error) return <div className="p-10 text-red-500">Failed to load powercard assignments</div>;
  if (!data) return <div className="p-10 text-terminal-amber animate-pulse">Loading Powercard Data...</div>;

  const { powercards, allTeams } = data;

  async function handleAssign(powercardId) {
    const teamId = selectedTeams[powercardId];
    if (!teamId) {
      setMsg("Error: Please select a team first");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/powercards/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powercardId, teamId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMsg("Error: " + result.error);
      } else {
        setMsg(`✓ Powercard assigned to ${result.teamName}`);
        mutate(); // Refresh the data
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

  async function handleRemove(teamId, powercardId, teamName) {
    if (!confirm(`Remove this powercard from ${teamName}?`)) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/powercards/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, powercardId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMsg("Error: " + (result.error || "Failed to remove"));
      } else {
        setMsg("✓ Powercard removed");
        mutate();
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

  const handleSelectChange = (powercardId, teamId) => {
    setSelectedTeams((prev) => ({ ...prev, [powercardId]: teamId }));
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
            Powercard Assignments Panel
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
        <div className="terminal-header">Powercard Assignments</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terminal-border text-terminal-muted">
                <th className="text-left px-4 py-3 font-normal">Powercard (ID)</th>
                <th className="text-left px-4 py-3 font-normal">Assigned Teams</th>
                <th className="text-left px-4 py-3 font-normal">Add Assignment</th>
              </tr>
            </thead>
            <tbody>
              {powercards.map((pc) => (
                <tr
                  key={pc.id}
                  className="border-b border-terminal-border/30 hover:bg-terminal-border/10 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="text-terminal-amber font-bold">{pc.name}</div>
                    <div className="text-terminal-muted text-xs">{pc.id}</div>
                    {pc.timing && (
                      <div className="text-terminal-muted text-xs italic mt-0.5">{pc.timing}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {pc.assignedTeams && pc.assignedTeams.length > 0 ? (
                        pc.assignedTeams.map((team) => (
                          <span
                            key={team._id}
                            className="inline-flex items-center gap-1 bg-terminal-green/10 border border-terminal-green/30 text-terminal-green px-2 py-0.5 rounded text-xs"
                          >
                            {team.teamName}
                            <button
                              onClick={() => handleRemove(team._id, pc.id, team.teamName)}
                              disabled={loading}
                              title="Remove from team"
                              className="ml-1 text-red-400 hover:text-red-300 disabled:opacity-50 leading-none"
                            >
                              ✕
                            </button>
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
                        value={selectedTeams[pc.id] || ""}
                        onChange={(e) => handleSelectChange(pc.id, e.target.value)}
                      >
                        <option value="">-- Choose Team --</option>
                        {allTeams.map((team) => (
                          <option key={team._id} value={team._id}>{team.teamName}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(pc.id)}
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
