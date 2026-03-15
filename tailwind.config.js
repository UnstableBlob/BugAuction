/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
        './pages/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                terminal: {
                    bg: '#0a0a0a',
                    surface: '#111111',
                    border: '#1a3a1a',
                    green: '#00ff41',
                    dimgreen: '#00aa29',
                    amber: '#ffb000',
                    red: '#ff3131',
                    muted: '#4a7a4a',
                    text: '#c0ffc0',
                },
            },
            fontFamily: {
                mono: ['"Share Tech Mono"', '"Courier New"', 'monospace'],
            },
            animation: {
                blink: 'blink 1s step-end infinite',
                scanline: 'scanline 8s linear infinite',
                flicker: 'flicker 0.15s infinite',
                'pulse-green': 'pulseGreen 2s ease-in-out infinite',
            },
            keyframes: {
                blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
                scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
                flicker: { '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: 1 }, '20%, 24%, 55%': { opacity: 0.4 } },
                pulseGreen: { '0%, 100%': { boxShadow: '0 0 5px #00ff41' }, '50%': { boxShadow: '0 0 20px #00ff41, 0 0 40px #00aa29' } },
            },
            boxShadow: {
                glow: '0 0 10px #00ff41, 0 0 20px #00aa29',
                'glow-red': '0 0 10px #ff3131, 0 0 20px #cc0000',
                'glow-amber': '0 0 10px #ffb000, 0 0 20px #cc8800',
            },
        },
    },
    plugins: [],
};
