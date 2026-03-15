"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamLoginPage() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, password, register: isRegistering }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
          (isRegistering ? "Registration failed" : "Login failed"),
        );
        setLoading(false);
        return;
      }
      // If the server already assigned us to a live game (late-join), skip the waiting room
      if (data.status === "playing") {
        router.push("/team/game");
      } else {
        router.push("/team/waiting");
      }
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="terminal-card w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-terminal-green text-3xl font-bold glow-text tracking-widest">
            PARAALLAX
          </div>
          <div className="text-terminal-muted text-xs mt-1 uppercase tracking-widest">
            CSI Event — Team {isRegistering ? "Registration" : "Login"}
          </div>
        </div>

        {/* Blinking cursor bar */}
        <div className="flex items-center gap-2 mb-6 text-terminal-muted text-xs">
          <span className="animate-blink text-terminal-green">█</span>
          <span>
            {isRegistering ? "CREATE NEW ACCOUNT" : "AUTHENTICATE TO PROCEED"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Name */}
          <div>
            <label className="terminal-header block mb-1" htmlFor="teamName">
              TEAM NAME
            </label>
            <input
              id="teamName"
              type="text"
              className="terminal-input"
              placeholder="Enter your team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
            />
            <p className="text-terminal-muted text-xs mt-1">
              {isRegistering
                ? "Choose a unique team name"
                : "Enter your registered team name"}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="terminal-header block mb-1" htmlFor="password">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              className="terminal-input"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-terminal-muted text-xs mt-1">
              {isRegistering
                ? "Create a secure password"
                : "Enter your password"}
            </p>
          </div>

          {error && (
            <div className="border border-terminal-red text-terminal-red text-sm px-4 py-2 rounded bg-red-950/20">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? isRegistering
                ? "REGISTERING..."
                : "AUTHENTICATING..."
              : isRegistering
                ? "> REGISTER"
                : "> LOGIN"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-terminal-border pt-4">
          {isRegistering ? (
            <div>
              <p className="text-terminal-muted text-xs mb-2">Already registered?</p>
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }}
                className="text-terminal-green text-xs hover:underline"
              >
                ➜ Login here
              </button>
            </div>
          ) : (
            <div>
              <p className="text-terminal-muted text-xs mb-2">New team?</p>
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                }}
                className="text-terminal-green text-xs hover:underline"
              >
                ➜ Register here
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
