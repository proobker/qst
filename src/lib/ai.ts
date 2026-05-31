import { getGeminiApiKey } from "@/lib/env";
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
  | { ok: true; quest: QuestDefinition; model: string }
  | { ok: false; reason: GenerateQuestErrorReason; message?: string };

/** Models tried in order (first with quota wins). */
const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
] as const;

const MAX_HOBBIES_IN_PROMPT = 5;

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
    Photography: "landmarks, viewpoints, architecture, street art, or scenic spots",
    "Film Photography": "landmarks, viewpoints, architecture, street art, or scenic spots",
    "Drone Photography": "landmarks, viewpoints, architecture, street art, or scenic spots",
    Food: "cafes, restaurants, food markets, bakeries, or local eateries",
    Fitness: "parks, walking trails, gyms, outdoor exercise areas, or sports facilities",
    Technology: "tech stores, maker spaces, coworking spots, or tech events",
    Reading: "libraries, bookstores, study cafes, or quiet reading spots",
    Art: "galleries, museums, street art, art supply stores, or creative spaces",
    Painting: "galleries, museums, street art, art supply stores, or creative spaces",
    Music: "music venues, instrument stores, performance spaces, or music schools",
    Hiking: "trails, nature reserves, parks, or scenic viewpoints",
    Backpacking: "trails, nature reserves, parks, or scenic viewpoints",
    Camping: "trails, nature reserves, parks, or scenic viewpoints",
    Travel: "tourist attractions, historical sites, cultural landmarks, or hidden gems",
    "Adventure Travel": "tourist attractions, historical sites, cultural landmarks, or hidden gems",
    "Local Exploration": "interesting local spots, neighborhoods, or hidden gems",
    Volunteering: "community centers, charity shops, animal shelters, or local NGOs",
    Entrepreneurship: "coworking spaces, business incubators, networking events, or startup hubs",
    Programming: "tech meetups, hackathons, coworking spaces, or tech conferences",
    Arduino: "maker spaces, hardware stores, or community workshops",
    Gaming: "game stores, esports venues, gaming cafes, or arcades",
    "PC Gaming": "game stores, esports venues, gaming cafes, or arcades",
    YouTube: "interesting local spots worth filming or documenting",
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

  return `
You are a quest generator for a life-RPG app that turns real life into an adventure.

Generate ONE personalized, location-aware quest as JSON.

USER CONTEXT:
- Hobbies (focus on these): ${hobbies.join(", ") || "General exploration"}
- Level: ${context.level}
- Location: ${hasLocation ? `lat=${context.location.latitude}, lon=${context.location.longitude}` : "general local area"}
- Nearby places: ${locationHints}

AVOID REPEATING:
- Seen: ${context.previousQuestTitles.slice(0, 6).join(" | ") || "none"}
- Rejected: ${context.rejectedQuests?.slice(0, 5).join(" | ") || "none"}

DIFFICULTY: Level 1-2 easy (80-100 XP), 3-4 medium (120-180 XP), 5+ hard (200-300 XP).

SAFETY: Legal, safe, public, single session. No weapons, drugs, trespass, illegal acts.

OUTPUT JSON only:
{"title":"","description":"","difficulty":"easy|medium|hard","xp_reward":0,"badge_reward":null,"estimated_time":"","category":""}
`.trim();
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 768,
        },
      }),
    },
  );

  const body = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }

  try {
    const payload = JSON.parse(body) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (payload.error) {
      return { ok: false, status: 500, body: payload.error.message ?? body };
    }
    const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      return { ok: false, status: 500, body: "Empty candidate" };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, status: 500, body };
  }
}

/**
 * Generates a quest using Gemini only.
 */
export async function generateQuest(context: QuestContext): Promise<GenerateQuestResult> {
  const apiKey = getGeminiApiKey();
  const promptHobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);

  console.log("[Gemini] generateQuest start", {
    apiKeyConfigured: Boolean(apiKey),
    hobbiesInPrompt: promptHobbies,
    totalHobbies: context.hobbies.length,
    level: context.level,
    hasLocation: context.location.latitude !== null && context.location.longitude !== null,
  });

  if (!apiKey) {
    console.error("[Gemini] Missing GOOGLE_GEMINI_API_KEY in .env.local");
    return { ok: false, reason: "missing_api_key" };
  }

  const prompt = buildPrompt(context);
  let lastRateLimit = false;

  for (const model of GEMINI_MODELS) {
    console.log(`[Gemini] Trying model: ${model}`);
    const result = await callGeminiModel(apiKey, model, prompt);

    if (!result.ok) {
      if (result.status === 429) {
        lastRateLimit = true;
        console.warn(`[Gemini] ${model} rate limited (429), trying next model...`);
        continue;
      }
      console.error(`[Gemini] ${model} failed:`, result.status, result.body.slice(0, 300));
      continue;
    }

    const parsed = extractJson(result.text);
    if (!isRecord(parsed)) {
      console.warn(`[Gemini] ${model} returned unparseable JSON`);
      continue;
    }

    const sanitized = sanitizeQuest(parsed, context);
    if (!sanitized) {
      console.warn(`[Gemini] ${model} JSON missing required fields`);
      continue;
    }

    if (!moderateQuest(sanitized)) {
      console.warn(`[Gemini] ${model} quest failed moderation`);
      continue;
    }

    console.log(`[Gemini] Success via ${model}:`, sanitized.title);
    return { ok: true, quest: sanitized, model };
  }

  if (lastRateLimit) {
    console.error("[Gemini] All models rate limited — wait or enable billing on Google AI Studio");
    return {
      ok: false,
      reason: "rate_limited",
      message: "Gemini free-tier quota exceeded. Wait a few minutes or check https://ai.google.dev/gemini-api/docs/rate-limits",
    };
  }

  return { ok: false, reason: "api_error", message: "All Gemini models failed to generate a quest." };
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
