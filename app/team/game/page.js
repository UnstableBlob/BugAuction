"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url) =>
  fetch(url).then((res) => {
    if (res.status === 401) throw new Error("Unauthorized");
    return res.json();
  });

export default function GamePage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const timerRef = useRef(null);

  const { data, error, mutate } = useSWR("/api/team/state", fetcher, {
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
      if (data.status === "success") { router.push("/team/success"); return; }
      if (data.status === "caught") { router.push("/team/caught"); return; }
      if (data.status === "ended") { router.push("/team/results"); return; }
      if (data.status === "waiting") { router.push("/team/waiting"); return; }
      if (data.status === "auctioning") { router.push("/team/auction"); return; }
      if (data.status === "loading") return;
      if (data.status === "playing" && data.puzzle) setState(data);
    }
  }, [data, error, router]);

  useEffect(() => {
    if (state && !state.puzzle) {
      const timer = setTimeout(() => router.push("/team/results"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  useEffect(() => {
    if (!state) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState((prev) =>
        prev ? { ...prev, timeSinceStart: (prev.timeSinceStart || 0) + 1 } : prev
      );
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state]);

  useEffect(() => {
    setAnswer("");
    setMessage("");
  }, [state?.puzzle?.puzzleId]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!state || submitting || !answer.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/team/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId: state.puzzle.puzzleId, answer: answer.trim() }),
      });
      const resData = await res.json();
      setMessage(resData.message || "");
      if (resData.allSolved) { router.push("/team/success"); return; }
      mutate();
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
    } catch { /* ignore */ }
    finally { setNavigating(false); }
  }

  const [debugSolving, setDebugSolving] = useState(false);
  async function debugSolveAndNext() {
    if (debugSolving) return;
    setDebugSolving(true);
    setMessage("");
    try {
      const res = await fetch("/api/team/debug-solve", { method: "POST" });
      const d = await res.json();
      if (d.allSolved) { router.push("/team/success"); return; }
      setMessage(d.message || "");
      mutate();
    } catch { setMessage("Debug solve failed."); }
    finally { setDebugSolving(false); }
  }

  if (!state) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>LOADING MISSION DATA...</div>
      </div>
    );
  }

  const puzzle = state.puzzle;
  const enemyName = puzzle?.title || "???";
  const enemyLevel = puzzle ? `${state.currentIndex + 1}` : "?";
  const playerName = teamName || "TEAM";
  const promptText = puzzle?.prompt || "";

  return (
    <div style={styles.page}>
      {state.hasActiveAuction && (
        <div style={styles.auctionBanner}>
          <span>⚡ LIVE AUCTION IN PROGRESS</span>
          <button onClick={() => router.push("/team/auction")} style={styles.auctionBtn}>
            {state.hasBidInActiveAuction ? "VIEW BIDS →" : "BID NOW →"}
          </button>
        </div>
      )}

      <div style={styles.battleWrap}>
        <div style={styles.battleContainer}>
          <img
            src="/images/bug_bg.png"
            alt="Battle Background"
            style={styles.bgImg}
            draggable={false}
          />

          {/* ── Zone A: Enemy Name (top-left beige box) ── */}
          <div style={{ ...styles.zone, top: "13.5%", left: "8%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(10px, 1.8vw, 20px)", color: "#2c2c2c", letterSpacing: "1px" }}>
              {enemyName}
            </span>
          </div>

          {/* ── Zone B: Enemy Level (top-left box, after "Lv") ── */}
          <div style={{ ...styles.zone, top: "13.5%", left: "38%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(10px, 1.8vw, 20px)", color: "#2c2c2c", letterSpacing: "2px" }}>
              {enemyLevel}
            </span>
          </div>

          {/* ── Zone C: Team name (bottom-right player box, above HP bar) ── */}
          <div style={{ ...styles.zone, top: "47%", left: "61%", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(10px, 1.8vw, 20px)", color: "#2c2c2c", letterSpacing: "1px", textTransform: "uppercase" }}>
              {playerName}
            </span>
          </div>

          {/* ── Zone D: Prompt text (bottom-left blue box) ── */}
          <div style={{ ...styles.zone, top: "71%", left: "4.5%", width: "52%", height: "12%", overflow: "hidden", textAlign: "left" }}>
            <span style={{ ...styles.pixelText, fontSize: "clamp(9px, 1.4vw, 15px)", color: "#ffffff", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {promptText}
            </span>
          </div>

          {/* ── Answer input (Now positioned in the white/beige box with dark text) ── */}
          {!state.isSolved && (
            <form
              onSubmit={handleSubmit}
              style={{ ...styles.zone, top: "84%", left: "5%", width: "51%", height: "8%", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span style={{ ...styles.pixelText, color: "#2c2c2c", fontSize: "clamp(9px, 1.5vw, 16px)", marginLeft: "8px" }}>▶</span>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                placeholder="type answer..."
                autoComplete="off"
                style={styles.answerInput}
              />
            </form>
          )}

          {state.isSolved && (
            <div style={{ ...styles.zone, top: "85%", left: "5%", height: "8%", display: "flex", alignItems: "center" }}>
              <span style={{ ...styles.pixelText, color: "#1e824c", fontSize: "clamp(9px, 1.5vw, 16px)", letterSpacing: "1px", marginLeft: "8px" }}>
                ✓ SOLVED — navigate to next
              </span>
            </div>
          )}

          {/* Message Feedback */}
          {message && (
            <div style={{ ...styles.zone, top: "94%", left: "5%", width: "51%", textAlign: "center" }}>
              <span style={{
                ...styles.pixelText,
                fontSize: "clamp(8px, 1.2vw, 13px)",
                color: message.toLowerCase().includes("correct") || message.toLowerCase().includes("solved")
                  ? "#55ff55" : "#ffbbbb",
              }}>
                {message}
              </span>
            </div>
          )}

          {/* ── Four-button grid ── */}

          {/* Top-left: DOWNLOAD */}
          {puzzle?.uiConfig?.downloadUrl ? (
            <a
              href={puzzle.uiConfig.downloadUrl}
              download
              style={{ ...styles.navBtn, top: "69%", left: "62.5%" }}
            >
              <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 18px)", color: "#2c2c2c", fontWeight: "bold" }}>DOWNLOAD</span>
              <span style={{ ...styles.pixelText, fontSize: "clamp(6px, 0.9vw, 14px)", color: "#555", marginTop: "2px" }}>(SOURCE)</span>
            </a>
          ) : (
            <div style={{ ...styles.navBtn, top: "69%", left: "60.5%", opacity: 0.4 }}>
              <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 14px)", color: "#2c2c2c", fontWeight: "bold" }}>DOWNLOAD</span>
            </div>
          )}

          {/* Top-right: SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting || state.isSolved}
            style={{ ...styles.navBtn, top: "69%", left: "80.5%", opacity: (!answer.trim() || submitting || state.isSolved) ? 0.4 : 1 }}
          >
            <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 18px)", color: "#2c2c2c", fontWeight: "bold" }}>
              {submitting ? "..." : "SUBMIT"}
            </span>
          </button>

          {/* Bottom-left: PREV */}
          <button
            onClick={() => navigate("prev")}
            disabled={state.currentIndex === 0 || navigating}
            style={{ ...styles.navBtn, top: "80%", left: "60.5%", opacity: (state.currentIndex === 0 || navigating) ? 0.4 : 1 }}
          >
            <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 18px)", color: "#2c2c2c", fontWeight: "bold" }}>PREV</span>
          </button>

          {/* Bottom-right: NEXT */}
          <button
            onClick={() => navigate("next")}
            disabled={state.currentIndex === state.totalPuzzles - 1 || navigating}
            style={{ ...styles.navBtn, top: "80%", left: "79.5%", opacity: (state.currentIndex === state.totalPuzzles - 1 || navigating) ? 0.4 : 1 }}
          >
            <span style={{ ...styles.pixelText, fontSize: "clamp(8px, 1.3vw, 14px)", color: "#2c2c2c", fontWeight: "bold" }}>NEXT</span>
          </button>
        </div>
      </div>

      <div style={styles.infoStrip}>
        <span style={styles.infoItem}>🧩 {state.currentIndex + 1} / {state.totalPuzzles}</span>
        <span style={styles.infoItem}>✔ Solved: {state.solvedCount}</span>
        <span style={styles.infoItem}>⭐ Score: {state.score || 0} pts</span>
        <span style={styles.infoItem}>Reward: {puzzle?.points || "-"} pts</span>
      </div>

      <div style={styles.debugBlock}>
        <span style={{ color: "#facc15", fontSize: 11, fontFamily: "monospace" }}>⚠ DEBUG MODE</span>
        <button onClick={debugSolveAndNext} disabled={debugSolving} style={styles.debugBtn}>
          {debugSolving ? "⏳ SOLVING..." : "⚡ NEXT + SOLVE"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PIXEL_FONT = "'PokéPixel', 'Courier New', monospace";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: 0,
    gap: 0,
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
  },
  loadingText: {
    fontFamily: PIXEL_FONT,
    color: "#00ff41",
    fontSize: 20,
    animation: "pulse 1.5s ease-in-out infinite",
    letterSpacing: 2,
  },
  auctionBanner: {
    width: "100%",
    background: "rgba(120,80,0,0.5)",
    border: "1px solid #ffb000",
    padding: "4px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    color: "#ffb000",
    fontFamily: PIXEL_FONT,
    fontSize: 11,
    letterSpacing: 1,
    flexShrink: 0,
  },
  auctionBtn: {
    background: "transparent",
    border: "1px solid #ffb000",
    color: "#ffb000",
    padding: "3px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    letterSpacing: 1,
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
  answerInput: {
    background: "transparent",
    border: "none", // Removed the white underline
    outline: "none",
    color: "#2c2c2c", // Changed text color to dark gray/black
    fontFamily: PIXEL_FONT,
    fontSize: "clamp(9px, 1.5vw, 16px)",
    width: "100%",
    letterSpacing: "1px",
    caretColor: "#2c2c2c",
    pointerEvents: "auto",
  },
  navBtn: {
    position: "absolute",
    background: "transparent",
    border: "none",
    width: "16.5%",     // Fine-tuned to perfectly match the box width
    height: "11.5%",    // Fine-tuned to perfectly match the box height
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "opacity 0.2s ease-in-out",
    textDecoration: "none",
    pointerEvents: "auto",
  },
  infoStrip: {
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 4,
    background: "#111",
    borderTop: "1px solid #1e3a1e",
    padding: "5px 12px",
    flexShrink: 0,
  },
  infoItem: {
    fontFamily: PIXEL_FONT,
    fontSize: 11,
    color: "#c0ffc0",
    letterSpacing: 1,
  },
  debugBlock: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    background: "rgba(60,50,0,0.4)",
    borderTop: "1px solid rgba(250,204,21,0.5)",
    padding: "5px 12px",
    flexShrink: 0,
  },
  debugBtn: {
    background: "transparent",
    border: "1px solid #ca8a04",
    color: "#fde047",
    padding: "4px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 1,
  },
};