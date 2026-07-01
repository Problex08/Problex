import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Look for ANTHROPIC_API_KEY in:
// 1. process.env (populated by Next.js from web/.env.local)
// 2. Parent project's .env (with UTF-16 LE support — Windows editors sometimes save files this way)
export function getAnthropicApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  const candidates = [
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const raw = fs.readFileSync(envPath);
      let content: string;
      // Detect UTF-16 LE via BOM (FF FE) or null bytes at odd positions
      if ((raw[0] === 0xFF && raw[1] === 0xFE) || (raw.length >= 4 && raw[3] === 0x00)) {
        content = raw.slice(2).toString('utf16le');
      } else {
        content = raw.toString('utf8');
      }
      const parsed = dotenv.parse(content);
      if (parsed.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = parsed.ANTHROPIC_API_KEY;
        return parsed.ANTHROPIC_API_KEY;
      }
    } catch {
      // skip unreadable files
    }
  }

  return undefined;
}
