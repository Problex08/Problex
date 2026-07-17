import Link from 'next/link';
import Image from 'next/image';
import { GITHUB_REPO_URL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-3">
        <Image src="/logo-wordmark.png" alt="Problex" width={1232} height={203} className="h-[17px] w-auto" />
        <div className="flex items-center gap-4 text-xs text-muted">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-fg transition-colors">
            GitHub
          </a>
          <span className="text-line">·</span>
          <Link href="/privacy" className="hover:text-fg transition-colors">Privacy</Link>
          <span className="text-line">·</span>
          <Link href="/terms" className="hover:text-fg transition-colors">Terms</Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 pb-6 text-[11px] text-muted/60">© 2026 Problex</div>
    </footer>
  );
}
