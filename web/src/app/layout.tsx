import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Problex',
  description: 'Validate your MCP server before you ship — protocol conformance, tool clarity, and agent compatibility, in one report.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-canvas text-fg min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
