'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const params = useSearchParams();
  const [url, setUrl] = useState(params.get('url') ?? '');
  const [includeAi, setIncludeAi] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const params = new URLSearchParams({ url: url.trim(), ai: String(includeAi) });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-fg mb-1">MCP Server Checker</h1>
          <p className="text-muted text-xs leading-snug">
            Validate your MCP server before you ship. Protocol conformance, tool clarity, and
            agent compatibility — in one report.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="url" className="sr-only">MCP Server URL</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://mcp.deepwiki.com/mcp"
            required
            className="w-full px-3 py-2 bg-canvas border border-line text-fg
                       placeholder-muted/60 focus:outline-none focus:border-suggestion
                       transition-colors font-mono text-sm rounded"
          />

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={includeAi}
                onChange={e => setIncludeAi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-[18px] bg-line peer-checked:bg-suggestion rounded-full transition-colors" />
              <div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-fg rounded-full transition-transform peer-checked:translate-x-[14px]" />
            </div>
            <div>
              <span className="text-xs font-medium text-fg/90 group-hover:text-fg transition-colors">
                Run full validation
              </span>
              <span className="text-[11px] text-muted ml-1.5">— behavior + compatibility checks</span>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-suggestion hover:brightness-110 active:brightness-90
                       text-canvas font-semibold text-sm rounded transition-[filter]"
          >
            Validate Server →
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted/70">
          10 free checks per hour · No account required · Works on any public MCP server
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas" />}>
      <HomeContent />
    </Suspense>
  );
}
