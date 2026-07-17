import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GITHUB_ISSUES_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service — Problex',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <article className="flex-1 max-w-[700px] mx-auto px-6 py-16 w-full">
        <h1 className="text-2xl font-bold text-fg tracking-tight">Terms of Service</h1>
        <p className="mt-1.5 text-xs text-muted">Last updated: July 2026</p>

        <p className="mt-6 text-sm text-fg/85 leading-relaxed">
          By using Problex, you agree to the following:
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">What Problex is</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          Problex is a free, beta-stage tool that validates MCP servers for protocol compliance, tool
          clarity, and agent compatibility. It is provided as-is, without warranty of any kind.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">No guarantee of accuracy</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          Problex&rsquo;s validation reports — including the &ldquo;Ready for Production&rdquo; verdict —
          reflect automated testing against Claude-based agent behavior only. A passing report does not
          guarantee your server will behave correctly with all AI models, all user inputs, or in all
          production conditions. You are responsible for your own testing and deployment decisions.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">Fair use</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          Problex is rate-limited (10 checks per hour per IP) to keep the service available to everyone.
          Attempting to circumvent rate limits, abuse the service, or use it for unlawful purposes is
          prohibited.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">No liability</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          We are not liable for any damages, losses, or issues arising from your use of Problex or reliance
          on its reports.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">Changes to the service</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          Problex is in active beta. Features, limits, and pricing may change as the product evolves.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-fg">Contact</h2>
        <p className="mt-3 text-sm text-fg/85 leading-relaxed">
          Questions can be raised via{' '}
          <a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer" className="text-suggestion hover:underline">
            GitHub Issues
          </a>.
        </p>
      </article>

      <Footer />
    </main>
  );
}
