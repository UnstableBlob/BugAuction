"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
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
            <div className="terminal-card w-full max-w-2xl text-center">
                <pre className="text-terminal-green text-xs leading-tight mb-6 glow-text overflow-x-auto">{`
  ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗
 ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝
 ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗  
 ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝  
 ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝`}</pre>

                <div className="border border-terminal-green rounded p-6 mb-6 bg-green-950/20">
                    <div className="text-terminal-green text-3xl font-bold glow-text mb-3">
                        ✓ MISSION ACCOMPLISHED
                    </div>
                    <div className="text-terminal-text text-sm leading-relaxed">
                        All puzzles solved. Your team has breached the system.<br />
                        Report to the admin desk immediately.
                    </div>
                </div>

                <div className="text-terminal-muted text-xs space-y-1">
                    <div>► Notify the invigilator at once</div>
                    <div>► Do NOT close this tab</div>
                    <div>► Time has been recorded</div>
                </div>

                <div className="mt-6 flex justify-center gap-2 text-terminal-green text-xs animate-pulse">
                    <span>▓▓▓▓▓▓▓▓▓▓▓▓
                        ▓▓▓▓▓▓▓▓</span>
                    <span>100%</span>
                </div>

                {/* finish button */}
                <div className="mt-6">
                    <button
                        id="finish-btn"
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
