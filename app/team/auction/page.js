"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => {
  if (res.status === 401 || res.status === 403 || res.status === 404) throw new Error("Unauthorized");
  return res.json();
});

export default function AuctionPage() {
  const router = useRouter();
  const [auctionState, setAuctionState] = useState(null);
  const [currency, setCurrency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");

  const { data, error, mutate } = useSWR("/api/team/auction/state", fetcher, { refreshInterval: 3000 });

  useEffect(() => {
    fetch("/api/team/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.teamName) setTeamName(d.teamName);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (error && error.message === "Unauthorized") {
      router.push("/team/login");
      return;
    }
    if (data) {
      if (data.status === "playing") {
        router.push("/team/game");
        return;
      }
      if (data.status === "success") {
        router.push("/team/success");
        return;
      }
      if (data.status === "caught") {
        router.push("/team/caught");
        return;
      }

      if (data.status === "auctioning" || data.status === "waiting") {
        setCurrency(data.currency || 0);
        setAuctionState(data.auction);
        setLoading(false);
      }
    }
  }, [data, error, router]);

  async function submitBid(e) {
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || parseInt(bidAmount) <= 0) {
      setMsg("Please enter a valid bid amount.");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/team/auction/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(bidAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setMsg("✓ Bid placed successfully!");
        setBidAmount("");
        mutate();
      }
    } catch {
      setMsg("Network error.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-terminal-muted animate-pulse">LOADING AUCTION INTERFACE...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <div className="text-terminal-amber text-2xl font-bold tracking-widest" style={{ textShadow: "0 0 10px #ffb000" }}>
              SILENT AUCTION
           </div>
           <div className="text-terminal-muted text-xs uppercase">
              {teamName ? `TEAM: ${teamName}` : "TEAM INTERFACE"}
           </div>
        </div>
        <div className="terminal-card py-2 px-4 shadow-amber">
          <div className="text-terminal-muted text-xs uppercase tracking-wider mb-1">Currency Balance</div>
          <div className="text-terminal-amber text-xl font-bold">{currency} <span className="text-xs">COINS</span></div>
        </div>
      </div>

      {!auctionState ? (
         <div className="terminal-card text-center py-12">
            <div className="text-terminal-muted animate-pulse mb-4">
               Waiting for the admin to start the next puzzle auction...
            </div>
            <div className="inline-block animate-spin text-terminal-amber">◌</div>
         </div>
      ) : (
         <div className="terminal-card border-amber-500/50">
            <div className="terminal-header text-amber-500">
               {auctionState.status === "open" ? "LIVE AUCTION: Bidding Open" : "AUCTION CLOSED: Results"}
            </div>

            {/* Puzzle Details */}
            {auctionState.puzzle && (
               <div className="mb-6 p-4 border border-terminal-border bg-black/50 rounded">
                  <div className="text-terminal-green text-sm uppercase tracking-wider mb-2 font-bold">Priority Target</div>
                  <div className="text-xl font-bold mb-2 text-white">{auctionState.puzzle.title}</div>
                  <div className="flex gap-4 mb-2">
                     <div className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase tracking-tighter">
                        Base: {auctionState.puzzle.basePrice}
                     </div>
                     <div className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded uppercase tracking-tighter">
                        Reward: {auctionState.puzzle.points} PTS
                     </div>
                  </div>
                  <div className="text-terminal-muted text-sm italic">{auctionState.puzzle.prompt}</div>
               </div>
            )}

            {/* Auction Status and Action */}
            {auctionState.status === "open" && !auctionState.hasBid ? (
               // Needs to bid
               <div className="bg-amber-950/20 border border-amber-500/30 p-6 rounded">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-sm text-terminal-muted">Enter your secret bid carefully. You only get one chance!</span>
                  </div>
                  <form onSubmit={submitBid} className="flex gap-4">
                     <input 
                        type="number" 
                        min="1" 
                        max={currency}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Amt..."
                        className="terminal-input w-32 text-xl !py-2"
                        disabled={submitting}
                     />
                     <button type="submit" disabled={submitting || !bidAmount} className="btn-amber flex-1 py-3 text-lg font-bold">
                        {submitting ? "SUBMITTING..." : "PLACE SECRET BID"}
                     </button>
                  </form>
                  {msg && (
                     <div className={`mt-4 text-xs ${msg.includes("✓") ? "text-terminal-green" : "text-terminal-red"}`}>
                        {msg}
                     </div>
                  )}
               </div>
            ) : auctionState.status === "open" && auctionState.hasBid ? (
               // Already bid
               <div className="bg-green-950/20 border border-green-500/30 p-6 rounded text-center">
                  <div className="text-terminal-green text-xl font-bold mb-2">BID SECURED</div>
                  <div className="text-terminal-muted mb-4">You have secretly bid <span className="text-terminal-amber font-bold">{auctionState.myBid}</span> coins on this puzzle.</div>
                  <div className="text-terminal-muted text-xs animate-pulse">Waiting for other teams and admin closure...</div>
               </div>
            ) : (
               // Auction Closed / Results
               <div className={`p-6 rounded text-center border ${auctionState.winnerTeamName === teamName ? "bg-green-950/20 border-green-500/50" : "bg-red-950/20 border-red-500/30"}`}>
                  <div className="text-xl font-bold mb-2 uppercase tracking-wider text-white">Auction Concluded</div>
                  <div className="text-terminal-muted mb-4">
                     Winning Team: <span className="text-terminal-amber font-bold">{auctionState.winnerTeamName || "No Bidders"}</span><br/>
                     Winning Bid: <span className="text-terminal-amber">{auctionState.winningBid || "0"}</span> coins
                  </div>
                  
                  {auctionState.winnerTeamName === teamName ? (
                     <div className="text-terminal-green font-bold glow-text">TARGET ACQUIRED! Puzzle added to your queue.</div>
                  ) : (
                     <div className="text-terminal-red">Target lost. Better luck on the next auction.</div>
                  )}
                  
                  <div className="mt-6 text-terminal-muted text-xs animate-pulse">Waiting for next auction...</div>
               </div>
            )}
         </div>
      )}
    </main>
  );
}
