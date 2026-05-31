import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModelOverride } from "@/lib/env";
import { QuestDefinition } from "@/lib/types";

export type QuestContext = {
  hobbies: string[];
  location: { latitude: number | null; longitude: number | null };
  level: number;
  previousQuestTitles: string[];
  completedQuests?: string[];
  rejectedQuests?: string[];
};

export type GenerateQuestErrorReason = "missing_api_key" | "rate_limited" | "api_error" | "invalid_response";

export type GenerateQuestResult =
  | { ok: true; quest: QuestDefinition; model: string; offline?: boolean }
  | { ok: false; reason: GenerateQuestErrorReason; message?: string };

/** Valid v1beta generateContent models (no deprecated 1.5 names). */
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
] as const;

const MAX_HOBBIES_IN_PROMPT = 5;
const RATE_LIMIT_COOLDOWN_MS = 120_000;

let geminiCooldownUntil = 0;

export function isGeminiInCooldown(): boolean {
  return Date.now() < geminiCooldownUntil;
}

export function getGeminiCooldownRemainingMs(): number {
  return Math.max(0, geminiCooldownUntil - Date.now());
}

function markRateLimited() {
  geminiCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
}

function clampDifficulty(level: number): QuestDefinition["difficulty"] {
  if (level <= 2) {
    return "easy";
  }
  if (level <= 4) {
    return "medium";
  }
  return "hard";
}

function pickHobbiesForPrompt(hobbies: string[], rotateIndex: number): string[] {
  const unique = [...new Set(hobbies.filter(Boolean))];
  if (unique.length <= MAX_HOBBIES_IN_PROMPT) {
    return unique;
  }
  const offset = rotateIndex % unique.length;
  const rotated = [...unique.slice(offset), ...unique.slice(0, offset)];
  return rotated.slice(0, MAX_HOBBIES_IN_PROMPT);
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const direct = tryParseJson(trimmed);
  if (direct !== null) {
    return direct;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) {
    const fencedParsed = tryParseJson(fenced.trim());
    if (fencedParsed !== null) {
      return fencedParsed;
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return tryParseJson(trimmed.slice(start, end + 1));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeQuest(input: Record<string, unknown>, context: QuestContext): QuestDefinition | null {
  const title = asTrimmedString(input.title);
  const description = asTrimmedString(input.description);
  if (!title || !description) {
    return null;
  }
  const difficultyInput = asTrimmedString(input.difficulty);
  const difficulty = difficultyInput ?? clampDifficulty(context.level);
  const safeDifficulty: QuestDefinition["difficulty"] =
    difficulty === "hard" || difficulty === "medium" || difficulty === "easy" ? difficulty : "easy";

  const baseXp = safeDifficulty === "easy" ? 80 : safeDifficulty === "medium" ? 130 : 220;
  const rawXp = Number(input.xp_reward);
  const xpReward = Number.isFinite(rawXp) ? Math.max(rawXp, 20) : baseXp;
  const hobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);

  return {
    title,
    description,
    difficulty: safeDifficulty,
    xp_reward: xpReward,
    badge_reward: asTrimmedString(input.badge_reward),
    estimated_time: asTrimmedString(input.estimated_time) || "30 min",
    category: asTrimmedString(input.category) || hobbies[0] || "General",
  };
}

function getLocationHints(hobbies: string[], hasLocation: boolean): string {
  if (!hasLocation) {
    return "in your local area or neighborhood";
  }

  const hobbyLocationMap: Record<string, string> = {
    Photography: "landmarks, viewpoints, or scenic spots",
    "Film Photography": "landmarks, viewpoints, or scenic spots",
    Food: "cafes, restaurants, or local eateries",
    Fitness: "parks, walking trails, or outdoor areas",
    Hiking: "trails, parks, or nature spots",
    Reading: "libraries or bookstores",
    Art: "galleries, museums, or creative spaces",
    Music: "music venues or performance spaces",
    Programming: "coworking spaces or tech meetups",
    Gaming: "game stores or gaming cafes",
  };

  const hints = hobbies
    .map((hobby) => {
      if (hobbyLocationMap[hobby]) {
        return hobbyLocationMap[hobby];
      }
      const key = Object.keys(hobbyLocationMap).find((k) =>
        hobby.toLowerCase().includes(k.toLowerCase()),
      );
      return key ? hobbyLocationMap[key] : null;
    })
    .filter(Boolean)
    .join(", ");

  return hints || "interesting places in your area";
}

function buildPrompt(context: QuestContext): string {
  const hobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);
  const hasLocation = context.location.latitude !== null && context.location.longitude !== null;
  const locationHints = getLocationHints(hobbies, hasLocation);

  return `Generate one real-world RPG quest as JSON.
Hobbies: ${hobbies.join(", ") || "exploration"}
Level: ${context.level}
Location: ${hasLocation ? `${context.location.latitude},${context.location.longitude}` : "local area"}
Nearby: ${locationHints}
Avoid titles: ${context.previousQuestTitles.slice(0, 5).join(" | ") || "none"}
Rejected: ${context.rejectedQuests?.slice(0, 4).join(" | ") || "none"}
Safe, legal, public, one session.
JSON keys: title, description, difficulty (easy|medium|hard), xp_reward, badge_reward, estimated_time, category`;
}

/** Used only when Gemini quota is exhausted so Discover stays usable. */
export function buildOfflineQuest(context: QuestContext): QuestDefinition {
  const hobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);
  const mainHobby = hobbies[0] ?? "Exploration";
  const difficulty = clampDifficulty(context.level);
  const baseXp = difficulty === "easy" ? 80 : difficulty === "medium" ? 130 : 220;
  const hasLocation = context.location.latitude !== null && context.location.longitude !== null;
  const place = hasLocation ? "within walking distance" : "in your neighborhood";
  const avoid = new Set([
    ...context.previousQuestTitles,
    ...(context.rejectedQuests ?? []),
  ]);

  const templates = [
    {
      title: `${mainHobby} Local Discovery`,
      description: `Visit a nearby spot related to ${mainHobby} ${place}. Take a photo and write two sentences about what you learned.`,
      estimated_time: "30-45 min",
    },
    {
      title: `${mainHobby} Mini Challenge`,
      description: `Complete a small real-world task connected to ${mainHobby} ${place}. Document it with a photo and a short reflection.`,
      estimated_time: "45 min",
    },
  ];

  const chosen = templates.find((t) => !avoid.has(t.title)) ?? templates[0];

  return {
    title: chosen.title,
    description: chosen.description,
    difficulty,
    xp_reward: baseXp,
    badge_reward: `${mainHobby} Explorer`,
    estimated_time: chosen.estimated_time,
    category: mainHobby,
  };
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as { status?: number; message?: string };
  if (err.status === 429) {
    return true;
  }
  const msg = String(err.message ?? error).toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("rate limit");
}

function isModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as { status?: number; message?: string };
  if (err.status === 404) {
    return true;
  }
  return String(err.message ?? error).toLowerCase().includes("not found");
}

async function callGeminiModel(
  client: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<{ ok: true; text: string } | { ok: false; rateLimited: boolean; notFound: boolean; message: string }> {
  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 768,
      },
    });

    const text = response.text ?? "";
    if (!text) {
      return { ok: false, rateLimited: false, notFound: false, message: "Empty response" };
    }
    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      rateLimited: isRateLimitError(error),
      notFound: isModelNotFoundError(error),
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveModelsToTry(): string[] {
  const override = getGeminiModelOverride();
  if (override) {
    return [override];
  }
  return [...GEMINI_MODELS];
}

/**
 * Generates a quest via Gemini. On quota exhaustion, returns an offline quest so the app keeps working.
 */
export async function generateQuest(context: QuestContext): Promise<GenerateQuestResult> {
  const apiKey = getGeminiApiKey();
  const promptHobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);

  if (isGeminiInCooldown()) {
    const remainingSec = Math.ceil(getGeminiCooldownRemainingMs() / 1000);
    console.warn(`[Gemini] In cooldown (${remainingSec}s left) — using offline quest builder`);
    return {
      ok: true,
      quest: buildOfflineQuest(context),
      model: "offline",
      offline: true,
    };
  }

  console.log("[Gemini] generateQuest start", {
    apiKeyConfigured: Boolean(apiKey),
    hobbiesInPrompt: promptHobbies,
    totalHobbies: context.hobbies.length,
    level: context.level,
  });

  if (!apiKey) {
    console.error("[Gemini] Missing GOOGLE_GEMINI_API_KEY in .env.local");
    return { ok: false, reason: "missing_api_key" };
  }

  const client = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(context);
  const models = resolveModelsToTry();
  let sawRateLimit = false;

  for (const model of models) {
    console.log(`[Gemini] Trying model: ${model}`);
    const result = await callGeminiModel(client, model, prompt);

    if (!result.ok) {
      if (result.rateLimited) {
        sawRateLimit = true;
        console.warn(`[Gemini] ${model} rate limited — trying next model`);
        continue;
      }
      if (result.notFound) {
        console.warn(`[Gemini] ${model} not found (404) — skipping`);
        continue;
      }
      console.error(`[Gemini] ${model} failed:`, result.message.slice(0, 200));
      continue;
    }

    const parsed = extractJson(result.text);
    if (!isRecord(parsed)) {
      console.warn(`[Gemini] ${model} unparseable JSON`);
      continue;
    }

    const sanitized = sanitizeQuest(parsed, context);
    if (!sanitized || !moderateQuest(sanitized)) {
      console.warn(`[Gemini] ${model} invalid or failed moderation`);
      continue;
    }

    console.log(`[Gemini] Success via ${model}:`, sanitized.title);
    return { ok: true, quest: sanitized, model };
  }

  if (sawRateLimit) {
    markRateLimited();
    console.warn("[Gemini] All models rate limited — using offline quest builder until cooldown resets");
    return {
      ok: true,
      quest: buildOfflineQuest(context),
      model: "offline",
      offline: true,
    };
  }

  console.error("[Gemini] All models failed");
  return { ok: false, reason: "api_error", message: "Could not generate a quest from any Gemini model." };
}

export function moderateQuest(quest: QuestDefinition): boolean {
  const normalized = `${quest.title} ${quest.description}`.toLowerCase();
  const forbidden = ["weapon", "fight", "drugs", "steal", "trespass", "illegal", "self-harm", "hate"];
  return !forbidden.some((word) => normalized.includes(word));
}

export function recommendBadges(completedCategories: string[]): string[] {
  const counts = completedCategories.reduce<Record<string, number>>((acc, category) => {
    const key = category.toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([category]) => `${category[0].toUpperCase()}${category.slice(1)} Specialist`);
}
