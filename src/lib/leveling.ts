import { LEVEL_THRESHOLDS } from "@/lib/constants";

export function levelFromXp(xp: number): number {
  let resolved = 1;
  for (const level of LEVEL_THRESHOLDS) {
    if (xp >= level.xp) {
      resolved = level.level;
    }
  }
  return resolved;
}

export function titleForLevel(level: number): string {
  const entry = LEVEL_THRESHOLDS.find((item) => item.level === level);
  if (entry) {
    return entry.title;
  }
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].title;
}

export function xpToNextLevel(xp: number): number {
  const next = LEVEL_THRESHOLDS.find((level) => level.xp > xp);
  if (!next) {
    return 0;
  }
  return Math.max(next.xp - xp, 0);
}
