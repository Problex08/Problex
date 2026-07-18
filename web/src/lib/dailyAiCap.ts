import { NextResponse } from 'next/server';
import { getRedis } from './rateLimit';

// A shared, global safety net on top of the per-IP rate limit — bounds total
// Claude API spend across ALL users per day, not just one IP's request rate.
const DEFAULT_DAILY_LIMIT = 60;
// Key TTL outlives a single UTC day so a slow-starting instance can't race the
// date rollover and leave the previous day's counter without an expiry.
const KEY_TTL_SECONDS = 26 * 60 * 60;

export const DAILY_CAP_MESSAGE =
  "AI-powered checks have reached today's capacity — protocol validation is still available. Please try again tomorrow, or check back later.";

function getDailyAiCheckLimit(): number {
  const raw = process.env.DAILY_AI_CHECK_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, i.e. resets at midnight UTC
}

export async function checkDailyAiCap(): Promise<{ allowed: boolean }> {
  const client = getRedis();
  if (!client) {
    // Fail open: an unconfigured or unreachable Redis shouldn't take the app down.
    return { allowed: true };
  }

  try {
    const limit = getDailyAiCheckLimit();
    const redisKey = `daily-ai-checks:${utcDateKey()}`;
    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.expire(redisKey, KEY_TTL_SECONDS);
    }
    return { allowed: count <= limit };
  } catch (err) {
    console.error('[dailyAiCap] Upstash request failed, failing open:', err);
    return { allowed: true };
  }
}

export function dailyAiCapResponse(): NextResponse {
  return NextResponse.json({ error: DAILY_CAP_MESSAGE }, { status: 503 });
}
