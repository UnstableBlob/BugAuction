export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="terminal-card text-center max-w-md w-full mx-4">
        <div className="text-terminal-green text-4xl font-bold glow-text mb-2">
          PARAALLAX
        </div>
        <div className="text-terminal-muted text-sm mb-8">
          CSI Event — Puzzle Competition Platform
        </div>
        <div className="space-y-3">
          <a
            href="/team/login"
            className="btn-primary block w-full text-center py-3"
          >
            → Team Login / Register
          </a>
          <a
            href="/admin/login"
            className="btn-amber block w-full text-center py-3"
          >
            → Admin Panel
          </a>
        </div>
        <div className="mt-8 text-terminal-muted text-xs">
          Teams: register or login at{" "}
          <code className="text-terminal-green">/team/login</code>
        </div>
      </div>
    </main>
  );
}
