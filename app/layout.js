import './globals.css';
import { Share_Tech_Mono } from 'next/font/google';

const techMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Paraallax — CSI Event',
  description: 'Paraallax puzzle competition for CSI college event.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={techMono.className}>
      <head>
      </head>
      <body className="bg-terminal-bg text-terminal-text font-mono min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
