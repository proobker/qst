import { getGeminiApiKey } from "@/lib/env";
import { QuestDefinition } from "@/lib/types";

type QuestContext = {
  hobbies: string[];
  location: { latitude: number | null; longitude: number | null };
  level: number;
  previousQuestTitles: string[];
  completedQuests?: string[];
  rejectedQuests?: string[];
};

function clampDifficulty(level: number): QuestDefinition["difficulty"] {
  if (level <= 2) {
    return "easy";
  }
  if (level <= 4) {
    return "medium";
  }
  return "hard";
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

  // Scale XP based on difficulty
  const baseXp = safeDifficulty === "easy" ? 80 : safeDifficulty === "medium" ? 130 : 220;
  const rawXp = Number(input.xp_reward);
  const xpReward = Number.isFinite(rawXp) ? Math.max(rawXp, 20) : baseXp;

  return {
    title,
    description,
    difficulty: safeDifficulty,
    xp_reward: xpReward,
    badge_reward: asTrimmedString(input.badge_reward),
    estimated_time: asTrimmedString(input.estimated_time) || "30 min",
    category: asTrimmedString(input.category) || context.hobbies[0] || "General",
  };
}

function getLocationHints(hobbies: string[], hasLocation: boolean): string {
  if (!hasLocation) {
    return "in your local area or neighborhood";
  }

  const hobbyLocationMap: Record<string, string> = {
    "Photography": "landmarks, viewpoints, architecture, street art, or scenic spots",
    "Food": "cafes, restaurants, food markets, bakeries, or local eateries",
    "Fitness": "parks, walking trails, gyms, outdoor exercise areas, or sports facilities",
    "Technology": "tech stores, maker spaces, coworking spots, or tech events",
    "Reading": "libraries, bookstores, study cafes, or quiet reading spots",
    "Art": "galleries, museums, street art, art supply stores, or creative spaces",
    "Music": "music venues, instrument stores, performance spaces, or music schools",
    "Hiking": "trails, nature reserves, parks, or scenic viewpoints",
    "Travel": "tourist attractions, historical sites, cultural landmarks, or hidden gems",
    "Volunteering": "community centers, charity shops, animal shelters, or local NGOs",
    "Entrepreneurship": "coworking spaces, business incubators, networking events, or startup hubs",
    "Programming": "tech meetups, hackathons, coworking spaces, or tech conferences",
    "DIY": "hardware stores, craft shops, maker spaces, or community workshops",
    "Gaming": "game stores, esports venues, gaming cafes, or arcades",
  };

  const hints = hobbies
    .map(hobby => hobbyLocationMap[hobby])
    .filter(Boolean)
    .join(", ");

  return hints || "interesting places in your area";
}

export async function generateQuest(context: QuestContext): Promise<QuestDefinition | null> {
  console.log("[Gemini] Generating quest with context:", {
    hobbies: context.hobbies,
    level: context.level,
    hasLocation: !!(context.location.latitude && context.location.longitude),
    previousQuestsCount: context.previousQuestTitles.length,
  });

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("[Gemini] No API key, quest generation skipped");
    return null;
  }

  const hasLocation = context.location.latitude !== null && context.location.longitude !== null;
  const locationHints = getLocationHints(context.hobbies, hasLocation);

  const prompt = `
You are a quest generator for a life-RPG app that turns real life into an adventure.

Generate ONE personalized, location-aware quest as JSON.

USER CONTEXT:
- Hobbies: ${context.hobbies.join(", ") || "General exploration"}
- Level: ${context.level} (affects quest difficulty)
- Location: ${hasLocation ? `lat=${context.location.latitude}, lon=${context.location.longitude}` : "unknown - use general local area"}
- Location hints: Look for ${locationHints}

PREVIOUS ACTIVITY (AVOID REPETITION):
- Previously seen quests: ${context.previousQuestTitles.slice(0, 5).join(" | ") || "none"}
- Completed quests: ${context.completedQuests?.slice(0, 3).join(" | ") || "none"}
- Rejected quests: ${context.rejectedQuests?.slice(0, 3).join(" | ") || "none"}

DIFFICULTY GUIDELINES:
- Level 1-2: Easy quests (simple activities, 30-45 min, 80-100 XP)
- Level 3-4: Medium quests (moderate challenge, 45-90 min, 120-180 XP)
- Level 5+: Hard quests (significant challenge, 90-120 min, 200-300 XP)

LOCATION-AWARE EXAMPLES:
- Photography: "Visit a local landmark and capture it from three unique angles"
- Food: "Find a highly-rated local cafe and try their signature dish"
- Fitness: "Complete a 2K walk through the nearest park or trail"
- Technology: "Visit a tech store and test a new gadget, then share your thoughts"
- Reading: "Spend 30 minutes reading at a local library or bookstore"

SAFETY CONSTRAINTS (STRICT):
- Legal, safe, realistic, and accessible in public spaces
- NO dangerous, illegal, hateful, or offensive activities
- NO activities requiring special equipment or permissions
- NO activities that could cause harm to self or others
- Must be achievable in a single session

OUTPUT FORMAT (JSON only):
{
  "title": "engaging quest title",
  "description": "clear, actionable instructions (2-3 sentences)",
  "difficulty": "easy|medium|hard",
  "xp_reward": number (based on difficulty),
  "badge_reward": "relevant badge name or null",
  "estimated_time": "time range (e.g., '30-45 min')",
  "category": "primary hobby category"
}

Generate a unique, creative quest that feels personal to the user's interests and location.
`.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            { 
              role: "user", 
              parts: [{ text: prompt }] 
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              required: ["title", "description", "difficulty", "xp_reward", "badge_reward", "estimated_time", "category"],
              properties: {
                title: { type: "STRING" },
                description: { type: "STRING" },
                difficulty: { type: "STRING", enum: ["easy", "medium", "hard"] },
                xp_reward: { type: "INTEGER" },
                badge_reward: { type: "STRING", nullable: true },
                estimated_time: { type: "STRING" },
                category: { type: "STRING" },
              },
            },
            // Lower temperature ensures compliance with the JSON Schema
            temperature: 0.2, 
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      console.error("[Gemini] API request failed:", response.status, response.statusText);
      return null;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      promptFeedback?: { blockReason?: string };
    };

    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) {
      console.error("[Gemini] No text in response", {
        finishReason: candidate?.finishReason ?? null,
        blockReason: payload.promptFeedback?.blockReason ?? null,
      });
      return null;
    }

    console.log("[Gemini] Raw response:", text.substring(0, 200));
    const parsed = extractJson(text);
    if (!isRecord(parsed)) {
      console.warn("[Gemini] Response was not a valid JSON object");
      return null;
    }

    const sanitized = sanitizeQuest(parsed, context);
    if (!sanitized) {
      console.warn("[Gemini] Response JSON missing required quest fields");
      return null;
    }

    console.log("[Gemini] Generated quest:", sanitized.title);
    return sanitized;
  } catch (error) {
    console.error("[Gemini] Error generating quest:", error);
    return null;
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
