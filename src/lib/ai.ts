import { getGeminiApiKey } from "@/lib/env";
import { QuestDefinition } from "@/lib/types";

type QuestContext = {
  hobbies: string[];
  location: { latitude: number | null; longitude: number | null };
  level: number;
  previousQuestTitles: string[];
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

function fallbackQuest(context: QuestContext): QuestDefinition {
  const mainHobby = context.hobbies[0] ?? "Exploration";
  const difficulty = clampDifficulty(context.level);
  const baseXp = difficulty === "easy" ? 80 : difficulty === "medium" ? 130 : 220;

  return {
    title: `${mainHobby} Neighborhood Challenge`,
    description: `Find one real-world place near you connected to ${mainHobby.toLowerCase()}, capture a photo, and write a two-sentence reflection about what you learned.`,
    difficulty,
    xp_reward: baseXp,
    badge_reward: `${mainHobby} Explorer`,
    estimated_time: "30-45 min",
    category: mainHobby,
  };
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function sanitizeQuest(input: Partial<QuestDefinition>, context: QuestContext): QuestDefinition {
  const difficulty = input.difficulty ?? clampDifficulty(context.level);
  const safeDifficulty: QuestDefinition["difficulty"] =
    difficulty === "hard" || difficulty === "medium" || difficulty === "easy" ? difficulty : "easy";

  return {
    title: input.title?.trim() || fallbackQuest(context).title,
    description: input.description?.trim() || fallbackQuest(context).description,
    difficulty: safeDifficulty,
    xp_reward: Math.max(Number(input.xp_reward ?? 100), 20),
    badge_reward: input.badge_reward?.trim() || null,
    estimated_time: input.estimated_time?.trim() || "30 min",
    category: input.category?.trim() || context.hobbies[0] || "General",
  };
}

export async function generateQuest(context: QuestContext): Promise<QuestDefinition> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return fallbackQuest(context);
  }

  const prompt = `
You generate safe real-world side quests for a life-RPG app.
Create exactly one quest as JSON with keys:
title, description, difficulty (easy|medium|hard), xp_reward (number), badge_reward, estimated_time, category.
Inputs:
- hobbies: ${context.hobbies.join(", ") || "General"}
- level: ${context.level}
- location: lat=${context.location.latitude ?? "unknown"}, lon=${context.location.longitude ?? "unknown"}
- avoid repeating prior quests: ${context.previousQuestTitles.join(" | ") || "none"}
Safety constraints:
- legal, safe, realistic, accessible in public.
- no dangerous, illegal, hateful, or offensive activities.
Output JSON only.
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
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      return fallbackQuest(context);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) {
      return fallbackQuest(context);
    }

    const parsed = extractJson(text) as Partial<QuestDefinition>;
    return sanitizeQuest(parsed, context);
  } catch {
    return fallbackQuest(context);
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
