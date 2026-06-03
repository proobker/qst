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
  | { ok: true; quests: QuestDefinition[]; model: string; offline?: boolean }
  | { ok: false; reason: GenerateQuestErrorReason; message?: string };

/** Valid v1beta generateContent models (no deprecated 1.5 names). */
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
] as const;

const MAX_HOBBIES_IN_PROMPT = 5;
const QUEST_BATCH_SIZE = 3;
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

function dedupeQuestsByTitle(quests: QuestDefinition[]): QuestDefinition[] {
  const seen = new Set<string>();
  return quests.filter((quest) => {
    const key = quest.title.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function extractQuestCandidates(parsed: unknown): Record<string, unknown>[] {
  if (!parsed || typeof parsed !== "object") {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord);
  }

  if (isRecord(parsed)) {
    const questsValue = parsed.quests;
    if (Array.isArray(questsValue)) {
      return questsValue.filter(isRecord);
    }
    return [parsed];
  }

  return [];
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
  return `Generate ${QUEST_BATCH_SIZE} real-world RPG quests in JSON format.
Use only these inputs:
- Hobbies: ${hobbies.join(", ") || "exploration"}
- Location: ${hasLocation ? `${context.location.latitude},${context.location.longitude}` : "local area"}
- Nearby place hints: ${locationHints}
Do not use any user background information, profile details, history, or assumptions.
All quests must be safe, legal, public, and completable in one session.
Return strict JSON only (no markdown), as:
{"quests":[{"title":"...","description":"...","difficulty":"easy|medium|hard","xp_reward":0,"badge_reward":"...","estimated_time":"...","category":"..."},
{"title":"...","description":"...","difficulty":"easy|medium|hard","xp_reward":0,"badge_reward":"...","estimated_time":"...","category":"..."},...]}`;
}

/** Used only when Gemini quota is exhausted so Discover stays usable. */
export function buildOfflineQuest(context: QuestContext, variantIndex = 0): QuestDefinition {
  const hobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);
  const hobbyIndex = hobbies.length > 0 ? variantIndex % hobbies.length : 0;
  const mainHobby = hobbies[hobbyIndex] ?? "Exploration";
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
    {
      title: `${mainHobby} Route Scout`,
      description: `Plan and walk a short route tied to ${mainHobby} ${place}. Capture one highlight and one improvement idea.`,
      estimated_time: "35-50 min",
    },
    {
      title: `${mainHobby} Community Checkpoint`,
      description: `Find a public place connected to ${mainHobby} ${place}. Complete one small activity and note what stood out.`,
      estimated_time: "40 min",
    },
    {
      title: `${mainHobby} Skill Sprint`,
      description: `Do a focused ${mainHobby} task ${place} for 25 minutes, then write a short recap of what you practiced.`,
      estimated_time: "30 min",
    },
  ];

  const template = templates[variantIndex % templates.length];
  const chosen = avoid.has(template.title)
    ? { ...template, title: `${template.title} ${variantIndex + 1}` }
    : template;

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

function buildOfflineQuestBatch(context: QuestContext, size = QUEST_BATCH_SIZE): QuestDefinition[] {
  const quests: QuestDefinition[] = [];
  for (let index = 0; index < size; index += 1) {
    quests.push(buildOfflineQuest(context, index));
  }
  return dedupeQuestsByTitle(quests).slice(0, size);
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

type GeminiClient = {
  models: {
    generateContent: (request: {
      model: string;
      contents: string;
      config?: {
        responseMimeType?: string;
        temperature?: number;
        maxOutputTokens?: number;
      };
    }) => Promise<{ text?: string | null }>;
  };
};

async function callGeminiModel(
  client: GeminiClient,
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
        maxOutputTokens: 2048,
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
 * Generates a quest batch via Gemini first. Uses offline quests only when Gemini cannot produce a full batch.
 */
export async function generateQuest(context: QuestContext): Promise<GenerateQuestResult> {
  try {
    const apiKey = getGeminiApiKey();
    const promptHobbies = pickHobbiesForPrompt(context.hobbies, context.rejectedQuests?.length ?? 0);

    if (isGeminiInCooldown()) {
      const remainingSec = Math.ceil(getGeminiCooldownRemainingMs() / 1000);
      console.warn(`[Gemini] In cooldown (${remainingSec}s left) — using offline quest batch`);
      return {
        ok: true,
        quests: buildOfflineQuestBatch(context),
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
      console.warn("[Gemini] Missing GOOGLE_GEMINI_API_KEY — using offline quest batch");
      return {
        ok: true,
        quests: buildOfflineQuestBatch(context),
        model: "offline",
        offline: true,
      };
    }

    const { GoogleGenAI } = await import("@google/genai");
    let client: GeminiClient;
    try {
      client = new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error("[Gemini] Failed to initialize client:", error);
      return {
        ok: true,
        quests: buildOfflineQuestBatch(context),
        model: "offline",
        offline: true,
      };
    }

    const prompt = buildPrompt(context);
    const models = resolveModelsToTry();
    let sawRateLimit = false;

    for (const model of models) {
      console.log(`[Gemini] Trying model: ${model}`);
      const result = await callGeminiModel(client, model, prompt);

      if (!result.ok) {
        if (result.rateLimited) {
          markRateLimited();
          sawRateLimit = true;
          console.warn(`[Gemini] ${model} rate limited — using offline quest batch`);
          return {
            ok: true,
            quests: buildOfflineQuestBatch(context),
            model: "offline",
            offline: true,
          };
        }
        if (result.notFound) {
          console.warn(`[Gemini] ${model} not found (404) — skipping`);
          continue;
        }
        console.error(`[Gemini] ${model} failed:`, result.message.slice(0, 200));
        continue;
      }

      const parsed = extractJson(result.text);
      const candidates = extractQuestCandidates(parsed);
      if (candidates.length === 0) {
        console.warn(`[Gemini] ${model} unparseable or empty JSON`);
        continue;
      }

      const sanitized = candidates
        .map((candidate) => sanitizeQuest(candidate, context))
        .filter((quest): quest is QuestDefinition => {
          if (!quest) return false;
          return moderateQuest(quest);
        });

      const uniqueSanitized = dedupeQuestsByTitle(sanitized);
      if (uniqueSanitized.length < QUEST_BATCH_SIZE) {
        console.warn(
          `[Gemini] ${model} returned ${uniqueSanitized.length}/${QUEST_BATCH_SIZE} valid quests — trying next model`,
        );
        continue;
      }

      const finalBatch = uniqueSanitized.slice(0, QUEST_BATCH_SIZE);
      console.log(`[Gemini] Success via ${model}:`, finalBatch.map((quest) => quest.title).join(" | "));
      return { ok: true, quests: finalBatch, model };
    }

    if (sawRateLimit) {
      markRateLimited();
      console.warn("[Gemini] All models rate limited — using offline quest batch builder until cooldown resets");
    } else {
      console.warn("[Gemini] Could not produce a full batch from any model — using offline quest batch builder");
    }

    return {
      ok: true,
      quests: buildOfflineQuestBatch(context),
      model: "offline",
      offline: true,
    };
  } catch (error) {
    console.error("[Gemini] generateQuest threw:", error);
    return {
      ok: true,
      quests: buildOfflineQuestBatch(context),
      model: "offline",
      offline: true,
    };
  }
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
