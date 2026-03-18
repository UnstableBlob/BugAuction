"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) =>
  fetch(url).then((res) => {
    if (res.status === 401 || res.status === 403 || res.status === 404)
      throw new Error("Unauthorized");
    return res.json();
  });

const PIXEL_FONT = "'PokéPixel', 'Courier New', monospace";

export default function AuctionPage() {
  const router = useRouter();
  const [auctionState, setAuctionState] = useState(null);
  const [currency, setCurrency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");

  const { data, error, mutate } = useSWR("/api/team/auction/state", fetcher, {
    refreshInterval: 3000,
  });

  useEffect(() => {
    fetch("/api/team/me")
      .then((r) => r.json())
      .then((d) => { if (d.teamName) setTeamName(d.teamName); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (error && error.message === "Unauthorized") {
      router.push("/team/login");
      return;
    }
    if (data) {
      if (data.status === "playing") { router.push("/team/game"); return; }
      if (data.status === "success") { router.push("/team/success"); return; }
      if (data.status === "caught") { router.push("/team/caught"); return; }
      if (data.status === "auctioning" || data.status === "waiting") {
        setCurrency(data.currency || 0);
        setAuctionState(data.auction);
        setLoading(false);
      }
    }
  }, [data, error, router]);

  async function submitBid(e) {
    e.preventDefault();
    const minBid = auctionState?.itemType === "powercard" ? (puzzle?.points || 1) : 1;
    if (!bidAmount || isNaN(bidAmount) || parseInt(bidAmount) < minBid) {
      setMsg(auctionState?.itemType === "powercard" ? `Min bid is ${minBid} ₵` : "Invalid bid.");
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
      const resData = await res.json();
      if (!res.ok) {
        setMsg("Error: " + resData.error);
      } else {
        setMsg("✓ Bid placed!");
        setBidAmount("");
        mutate();
      }
    } catch {
      setMsg("Network error.");
    }
    setSubmitting(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>LOADING AUCTION INTERFACE...</div>
      </div>
    );
  }

  const puzzle = auctionState?.puzzle;
  const targetName = puzzle?.title || "---";
  const promptText = puzzle?.prompt || "";
  const isOpen = auctionState?.status === "open";
  const hasBid = auctionState?.hasBid;
  const isClosed = auctionState && !isOpen;
  const noAuction = !auctionState;

  return (
    <div style={styles.page}>
      <div style={styles.battleWrap}>
        <div style={styles.battleContainer}>
          <img
            src="/images/auction_bg.png"
            alt="Auction Background"
            style={styles.bgImg}
            draggable={false}
          />

          {/* ══ CONTAINER 1: Team & Balance (top-left beige box) ══ */}
          {/* Team name — mapped to the right of "TEAM:" */}
          <div style={{ ...styles.zone, top: "6.5%", left: "18%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.5vw, 18px)", color: "#2c2c2c", letterSpacing: "1px", textTransform: "uppercase" }}>
              {teamName || "---"}
            </span>
          </div>

          {/* Currency balance — centered in the bottom half of the left box */}
          <div style={{ ...styles.zone, top: "15%", left: "4%", width: "28%", textAlign: "center" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(11px, 2vw, 22px)", color: "#2c2c2c", letterSpacing: "1px" }}>
              ₵ {currency}
            </span>
          </div>

          {/* ══ CONTAINER 2: Bidding details (top-right beige box) ══ */}
          {/* Target name — Top-centered header area */}
          <div style={{ ...styles.zone, top: "5.5%", left: "36%", width: "61%", textAlign: "center" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.6vw, 18px)", color: "#2c2c2c", letterSpacing: "1px", textTransform: "uppercase" }}>
              {targetName}
            </span>
          </div>

          {/* COST value — shown only for powercard auctions */}
          <div style={{ ...styles.zone, top: "17.5%", left: "47%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.5vw, 18px)", color: "#2c2c2c", letterSpacing: "1px" }}>
              {auctionState?.itemType === "powercard" ? (puzzle?.points ?? "") : ""}
            </span>
          </div>

          {/* REWARD value — shown only for puzzle auctions */}
          <div style={{ ...styles.zone, top: "17.5%", left: "88%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.5vw, 18px)", color: "#2c2c2c", letterSpacing: "1px" }}>
              {auctionState?.itemType !== "powercard" ? (puzzle?.points ?? "") : ""}
            </span>
          </div>

          {/* ── Bid Input / State Displays ── */}
          {noAuction && (
            <div style={{ ...styles.zone, top: "34%", left: "36%", width: "61%", textAlign: "center" }}>
              <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.5vw, 18px)", color: "#8a7040" }}>
                WAITING FOR NEXT AUCTION...
              </span>
            </div>
          )}

          {isOpen && !hasBid && (
            <>
              {/* Invisible input mapped perfectly over the white rect inside the gold box */}
              <form
                onSubmit={submitBid}
                style={{ ...styles.zone, top: "32.5%", left: "50.5%", width: "32%", height: "8.5%", display: "flex", alignItems: "center" }}
              >
                <input
                  type="number"
                  min={auctionState?.itemType === "powercard" ? (puzzle?.points || 1) : 1}
                  max={currency}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={auctionState?.itemType === "powercard" ? `≥${puzzle?.points}` : "0"}
                  autoComplete="off"
                  disabled={submitting}
                  style={styles.bidInput}
                />
              </form>

              {/* Invisible submit mapped over the "PLACE SECRET BID" button graphic */}
              <button
                onClick={submitBid}
                disabled={submitting || !bidAmount}
                style={{
                  ...styles.zone,
                  top: "46.5%",
                  left: "49.5%",
                  width: "37.5%",
                  height: "9%",
                  background: "transparent",
                  border: "none",
                  cursor: submitting || !bidAmount ? "not-allowed" : "pointer",
                  opacity: submitting || !bidAmount ? 0.35 : 1,
                  pointerEvents: "auto",
                }}
              />
            </>
          )}

          {isOpen && hasBid && (
            /* Bid confirmed text — overlaid inside the white input box */
            <>
              <div style={{ ...styles.zone, top: "33%", left: "50.5%", width: "32%", height: "8.5%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 15px)", color: "#1e824c", letterSpacing: "1px" }}>
                  ✓ BID SECURED
                </span>
              </div>
              <div style={{ ...styles.zone, top: "43%", left: "36%", width: "61%", textAlign: "center" }}>
                <span style={{ ...styles.pixelText, fontSize: "clamp(7px, 1vw, 13px)", color: "#8a7040", letterSpacing: "0.5px" }}>
                  {auctionState.myBid} ₵ PLACED — WAITING FOR CLOSURE...
                </span>
              </div>
            </>
          )}

          {isClosed && (
            /* Auction Closed — Centered in the middle of the right box */
            <div style={{ ...styles.zone, top: "27.5%", left: "36%", width: "61%", height: "20%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.5vw, 18px)", color: "#2c2c2c", letterSpacing: "1px" }}>
                AUCTION CLOSED
              </span>
              <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 15px)", color: "#5a4010" }}>
                WINNER: {auctionState.winnerTeamName || "NONE"}
              </span>
            </div>
          )}

          {/* Feedback messages (Errors, etc.) - placed safely between input and button */}
          {msg && !msg.includes("✓") && (
            <div style={{ ...styles.zone, top: "42.5%", left: "36%", width: "61%", textAlign: "center" }}>
              <span style={{
                ...styles.pixelText,
                fontSize: "clamp(7px, 1.1vw, 13px)",
                color: "#cc2222",
                letterSpacing: "0.5px",
              }}>
                {msg}
              </span>
            </div>
          )}

          {/* ══ CONTAINER 3: Dialog box (bottom blue strip) ══ */}
          {/* Text begins just past the CD icon on the left */}
          <div style={{ ...styles.zone, top: "65%", left: "17%", width: "78%", height: "26%", overflow: "hidden", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.4vw, 25px)", color: "#ffffff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {promptText ||
                (noAuction
                  ? "Waiting for the next puzzle to be auctioned by the admin."
                  : "Enter your secret bid carefully. You only get one chance!"
                )
              }
            </span>
          </div>

        </div>
      </div>

      <div style={styles.infoStrip}>
        <span style={styles.infoItem}>💰 Balance: {currency} ₵</span>
        {auctionState && <span style={styles.infoItem}>📦 {isOpen ? "BIDDING OPEN" : "AUCTION CLOSED"}</span>}
        {puzzle?.points != null && <span style={styles.infoItem}>⭐ {auctionState?.itemType === "powercard" ? `Cost: ${puzzle.points}` : `Reward: ${puzzle.points} pts`}</span>}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
  },
  loadingText: {
    fontFamily: PIXEL_FONT,
    color: "#ffb000",
    fontSize: 18,
    letterSpacing: 2,
  },
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: 0,
    gap: 0,
  },
  battleWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    background: "#0a0a0a",
    overflow: "hidden",
  },
  battleContainer: {
    position: "relative",
    height: "100vh",
    width: "auto",
    aspectRatio: "1320 / 990",
    userSelect: "none",
    flexShrink: 0,
  },
  bgImg: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "fill",
    imageRendering: "pixelated",
  },
  zone: {
    position: "absolute",
    pointerEvents: "none",
  },
  pixelText: {
    fontFamily: PIXEL_FONT,
    display: "inline-block",
    imageRendering: "pixelated",
    textShadow: "1px 1px 0 rgba(0,0,0,0.28)",
  },
  bidInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#2c2c2c",
    fontFamily: PIXEL_FONT,
    fontSize: "clamp(12px, 2.2vw, 24px)",
    width: "100%",
    textAlign: "center",
    letterSpacing: "2px",
    caretColor: "#2c2c2c",
    pointerEvents: "auto",
    MozAppearance: "textfield", // Hide spinner arrows on Firefox
  },
  infoStrip: {
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 4,
    background: "#111",
    borderTop: "1px solid #3a2e00",
    padding: "5px 12px",
    flexShrink: 0,
  },
  infoItem: {
    fontFamily: PIXEL_FONT,
    fontSize: 11,
    color: "#ffcc44",
    letterSpacing: 1,
  },
};