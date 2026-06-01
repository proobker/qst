export type LevelUpCelebration = {
  notificationId: string;
  level: number;
  previousLevel: number;
  displayName: string;
  rarity: string;
  title: string;
  rank: string;
};

export function parseLevelFromNotificationMessage(message: string): number | null {
  const match = message.match(/Level (\d+)/);
  if (!match) {
    return null;
  }
  const level = Number(match[1]);
  return Number.isFinite(level) && level > 0 ? level : null;
}

/** Google Play–style accent per rarity tier */
export function rarityAccentColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: "#94a3b8",
    Uncommon: "#34d399",
    Rare: "#60a5fa",
    Epic: "#c084fc",
    Legendary: "#fbbf24",
    Mythic: "#f472b6",
    Ancient: "#fb923c",
    Divine: "#fde047",
    Celestial: "#67e8f9",
    Transcendent: "#e879f9",
    Unique: "#3ddc84",
  };
  return colors[rarity] ?? "#3ddc84";
}
