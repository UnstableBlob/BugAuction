"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("API error");
  return res.json();
});

export default function PowercardManagement() {
  const router = useRouter();
  const { data: teamsData, mutate: mutateTeams } = useSWR("/api/admin/teams", fetcher, { refreshInterval: 5000 });
  const { data: powercardsData } = useSWR("/api/admin/powercards/list", fetcher);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const teams = teamsData?.teams || [];
  const allPowercards = powercardsData?.powercards || [];

  async function handleRemove(teamId, powercardId) {
    if (!confirm("Are you sure you want to remove this powercard?")) return;

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
        setMsg(`✓ Powercard removed`);
        mutateTeams(); 
      }
    } catch (e) {
      setMsg("Network error");
    }
    setLoading(false);
  }

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
            Powercard Management Panel
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
        <div className="terminal-header">Team Powercards</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terminal-border text-terminal-muted">
                <th className="text-left px-4 py-3 font-normal">Team Name</th>
                <th className="text-left px-4 py-3 font-normal">Owned Powercards</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team._id}
                  className="border-b border-terminal-border/30 hover:bg-terminal-border/10 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="text-terminal-green font-bold">{team.teamName}</div>
                    <div className="text-terminal-muted text-xs">ID: {team.tid || team._id}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-4">
                      {team.assignedPowercardIds && team.assignedPowercardIds.length > 0 ? (
                        team.assignedPowercardIds.map((pcId, idx) => {
                          const pc = allPowercards.find(p => p.id === pcId);
                          return (
                            <div
                              key={`${team._id}-${pcId}-${idx}`}
                              className="relative flex flex-col items-center gap-1 bg-amber-950/20 border border-terminal-amber/30 rounded p-2 w-36"
                            >
                              {pc?.image && (
                                <img
                                  src={pc.image}
                                  alt={pc?.name || pcId}
                                  className="w-24 h-24 object-contain rounded"
                                />
                              )}
                              <div className="text-terminal-amber text-[11px] font-bold text-center leading-tight">
                                {pc?.name || pcId}
                              </div>
                              {pc?.timing && (
                                <div className="text-terminal-muted text-[9px] text-center italic">
                                  {pc.timing}
                                </div>
                              )}
                              <button
                                onClick={() => handleRemove(team._id, pcId)}
                                disabled={loading}
                                className="mt-1 w-full text-[10px] font-bold py-0.5 border border-red-500/50 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                title="Mark as Used / Remove"
                              >
                                ✕ USED
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-terminal-muted italic text-xs">No powercards owned</span>
                      )}
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
