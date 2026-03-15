'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
            router.push('/admin/dashboard');
        } catch {
            setError('Network error. Try again.');
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="terminal-card w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-terminal-amber text-3xl font-bold tracking-widest mb-1" style={{ textShadow: '0 0 10px #ffb000' }}>
                        PARAALLAX
                    </div>
                    <div className="text-terminal-muted text-xs uppercase tracking-widest">Admin Control Panel</div>
                </div>

                <div className="flex items-center gap-2 mb-6 text-terminal-muted text-xs">
                    <span className="animate-blink text-terminal-amber">█</span>
                    <span>ADMIN AUTHENTICATION REQUIRED</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="terminal-header block mb-1" htmlFor="email">ADMIN EMAIL</label>
                        <input
                            id="email"
                            type="email"
                            className="terminal-input"
                            placeholder="admin@csi.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="terminal-header block mb-1" htmlFor="admin-password">PASSWORD</label>
                        <input
                            id="admin-password"
                            type="password"
                            className="terminal-input"
                            placeholder="Enter admin password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="border border-terminal-red text-terminal-red text-sm px-4 py-2 rounded bg-red-950/20">
                            ⚠ {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-amber w-full py-3 disabled:opacity-40">
                        {loading ? 'AUTHENTICATING...' : '> ACCESS ADMIN PANEL'}
                    </button>
                </form>
            </div>
        </main>
    );
}
