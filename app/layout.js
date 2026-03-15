import './globals.css';

export const metadata = {
  title: 'Paraallax — CSI Event',
  description: 'Paraallax puzzle competition for CSI college event.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-terminal-bg text-terminal-text font-mono min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
