import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type Anthropic from "@anthropic-ai/sdk";

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const LIMITS = {
  perHour: num(process.env.GRAPHY_PER_HOUR, 4),
  perDay: num(process.env.GRAPHY_PER_DAY, 12),
  // 4.5 a day is about 135 a month, under the 150 ceiling; the workspace spend limit is the hard stop.
  dailyBudgetUsd: num(process.env.GRAPHY_DAILY_BUDGET_USD, 4.5),
  // Bring-your-own-key users pay for themselves; this only protects the server and the store.
  byoPerHour: num(process.env.GRAPHY_BYO_PER_HOUR, 60),
  // Across all visitors on the house key, so rotating IPs cannot burst the budget in minutes.
  globalPerMinute: num(process.env.GRAPHY_GLOBAL_PER_MINUTE, 10),
  maxTurns: num(process.env.GRAPHY_MAX_TURNS, 8),
  maxContextTokens: num(process.env.GRAPHY_MAX_CONTEXT_TOKENS, 160_000),
  maxQuestionChars: 2_000,
  conversationTtlSeconds: 2 * 60 * 60,
};

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

// Without a store there is no rate limit and no budget, so a public deployment refuses to run.
export const redis = url && token ? new Redis({ url, token }) : null;

const hourly = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.perHour, "1 h"), prefix: "graphy:h" })
  : null;
const daily = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.perDay, "1 d"), prefix: "graphy:d" })
  : null;

const byo = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.byoPerHour, "1 h"), prefix: "graphy:byo" })
  : null;

export async function checkByoRate(ip: string): Promise<string | null> {
  if (!byo) return null;
  return (await byo.limit(ip)).success ? null : "Even with your own key, that's a lot of questions. Give Graphy a few minutes.";
}

const global = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.globalPerMinute, "1 m"), prefix: "graphy:g" })
  : null;

export interface Quota {
  hourLeft: number;
  dayLeft: number;
}

export type RateResult = { ok: true; quota: Quota | null } | { ok: false; message: string };

export async function checkRate(ip: string): Promise<RateResult> {
  if (!hourly || !daily || !global) return { ok: true, quota: null };
  const g = await global.limit("all");
  if (!g.success) return { ok: false, message: "Graphy is swamped right now. Try again in a minute, or bring your own API key." };
  const [h, d] = await Promise.all([hourly.limit(ip), daily.limit(ip)]);
  if (!d.success) return { ok: false, message: "That's your lot for today. Come back tomorrow, or bring your own API key." };
  if (!h.success) {
    const mins = Math.max(1, Math.ceil((h.reset - Date.now()) / 60_000));
    return { ok: false, message: `That's ${LIMITS.perHour} questions this hour. Try again in ${mins} min, or bring your own API key.` };
  }
  return { ok: true, quota: { hourLeft: h.remaining, dayLeft: d.remaining } };
}

// One question in flight per visitor: parallel tabs cannot multiply spend.
export async function acquire(ip: string): Promise<boolean> {
  if (!redis) return true;
  return (await redis.set(`graphy:busy:${ip}`, 1, { nx: true, ex: 150 })) === "OK";
}

export async function release(ip: string) {
  if (redis) await redis.del(`graphy:busy:${ip}`);
}

const dayKey = () => `graphy:spend:${new Date().toISOString().slice(0, 10)}`;

export async function budgetLeft(): Promise<boolean> {
  if (!redis) return true;
  const spent = Number((await redis.get<number>(dayKey())) ?? 0);
  return spent < LIMITS.dailyBudgetUsd;
}

// Sonnet 5.5 list prices, USD per million tokens; 1h cache writes bill at 2x input.
const PRICE = { input: 2, cacheWrite1h: 4, cacheRead: 0.2, output: 10, webSearch: 0.01 };

export function costUsd(u: Anthropic.Beta.BetaUsage): number {
  const m = 1_000_000;
  return (
    (u.input_tokens * PRICE.input) / m +
    ((u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite1h) / m +
    ((u.cache_read_input_tokens ?? 0) * PRICE.cacheRead) / m +
    (u.output_tokens * PRICE.output) / m +
    (u.server_tool_use?.web_search_requests ?? 0) * PRICE.webSearch
  );
}

export async function recordSpend(usd: number) {
  if (!redis || usd <= 0) return;
  const k = dayKey();
  await redis.incrbyfloat(k, usd);
  await redis.expire(k, 3 * 24 * 60 * 60);
}

export interface Conversation {
  messages: Anthropic.Beta.BetaMessageParam[];
  turns: number;
  contextTokens: number;
}

const mem = new Map<string, Conversation>();

export async function loadConversation(id: string): Promise<Conversation | null> {
  if (!redis) return mem.get(id) ?? null;
  return (await redis.get<Conversation>(`graphy:conv:${id}`)) ?? null;
}

export async function saveConversation(id: string, c: Conversation) {
  if (!redis) {
    mem.set(id, c);
    return;
  }
  await redis.set(`graphy:conv:${id}`, c, { ex: LIMITS.conversationTtlSeconds });
}
