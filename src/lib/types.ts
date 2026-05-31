import { QUEST_STATUSES } from "@/lib/constants";

export type QuestStatus = (typeof QUEST_STATUSES)[number];

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  location_enabled: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type QuestDefinition = {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  xp_reward: number;
  badge_reward: string | null;
  estimated_time: string;
  category: string;
};
