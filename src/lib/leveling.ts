import levelDefs from "../../assets/lvls.json";
import { XP_PER_LEVEL } from "@/lib/constants";

export type LevelDefinition = {
  level: number;
  rarity: string;
  title: string;
  rank: string;
  displayName: string;
};

const LEVELS = levelDefs as LevelDefinition[];

export const MAX_LEVEL = LEVELS.length;

export function getLevelDefinition(level: number): LevelDefinition | undefined {
  const clamped = Math.min(Math.max(level, 1), MAX_LEVEL);
  return LEVELS[clamped - 1];
}

export function xpForLevel(level: number): number {
  const clamped = Math.min(Math.max(level, 1), MAX_LEVEL);
  return (clamped - 1) * XP_PER_LEVEL;
}

export function levelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp);
  return Math.min(MAX_LEVEL, Math.floor(safeXp / XP_PER_LEVEL) + 1);
}

export function titleForLevel(level: number): string {
  return getLevelDefinition(level)?.displayName ?? LEVELS[0].displayName;
}

export function xpToNextLevel(xp: number): number {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) {
    return 0;
  }
  return Math.max(xpForLevel(level + 1) - xp, 0);
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}
