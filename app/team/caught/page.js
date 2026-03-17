"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CaughtPage() {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [finishing, setFinishing] = useState(false);

    async function finishGame() {
        if (finishing) return;
        setFinishing(true);
        setMessage("");
        try {
            const res = await fetch("/api/team/finish", { method: "POST" });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage("Redirecting to results...");
                setTimeout(() => router.push("/team/results"), 800);
            } else {
                setMessage("Error: " + (data.error || "Failed to finish game"));
            }
        } catch {
            setMessage("Network error. Try again.");
        } finally {
            setFinishing(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="terminal-card w-full max-w-2xl text-center border-terminal-red">
                <pre className="text-terminal-red text-xs leading-tight mb-6 overflow-x-auto" style={{ textShadow: '0 0 10px #ff3131' }}>{`
  ██████╗ ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗████████╗
 ██╔════╝██╔═══██╗██║   ██║██╔════╝ ██║  ██║╚══██╔══╝
 ██║     ███████║██║   ██║██║  ███╗███████║   ██║   
 ██║     ██╔══██║██║   ██║██║   ██║██╔══██║   ██║   
 ╚██████╗██║  ██║╚██████╔╝╚██████╔╝██║  ██║   ██║   
  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝  `}</pre>

                <div className="border border-terminal-red rounded p-6 mb-6 bg-red-950/20">
                    <div className="text-terminal-red text-3xl font-bold mb-3" style={{ textShadow: '0 0 10px #ff3131' }}>
                        ✗ TIME EXPIRED — CAUGHT
                    </div>
                    <div className="text-terminal-text text-sm leading-relaxed">
                        The session has been concluded by the administrator.<br />
                        Your final score has been locked. Await further instructions.
                    </div>
                </div>

                <div className="text-terminal-muted text-xs space-y-1">
                    <div>► Do NOT close this tab</div>
                    <div>► Wait for the invigilator</div>
                    <div>► Game over</div>
                </div>

                <div className="mt-6 text-terminal-red text-xs animate-pulse">
                    ▸ ACCESS TERMINATED ◂
                </div>

                {/* finish button */}
                <div className="mt-6">
                    <button
                        onClick={finishGame}
                        disabled={finishing}
                        className="btn-amber w-full py-3 text-center"
                    >
                        {finishing ? "⏳ FINISHING..." : "✓ FINISH GAME"}
                    </button>
                </div>
                {message && (
                    <div className="mt-4 text-center text-sm text-terminal-green">
                        {message}
                    </div>
                )}
            </div>
        </main>
    );
}
