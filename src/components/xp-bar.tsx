import { isMaxLevel, xpForLevel, xpToNextLevel } from "@/lib/leveling";
import { cn } from "@/lib/utils";

type XpBarProps = {
  xp: number;
  level: number;
  className?: string;
};

export function XpBar({ xp, level, className }: XpBarProps) {
  const currentThreshold = xpForLevel(level);
  const nextThreshold = isMaxLevel(level) ? undefined : xpForLevel(level + 1);
  const progress = nextThreshold
    ? Math.min(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;
  const remainingXp = nextThreshold ? xpToNextLevel(xp) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-muted">
        <span>{xp} XP</span>
        {nextThreshold ? <span>{remainingXp} XP to next level</span> : <span>Max level</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
