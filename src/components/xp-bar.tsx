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
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-xs font-medium text-muted">
        <span>{xp.toLocaleString()} XP</span>
        {nextThreshold ? (
          <span>{remainingXp.toLocaleString()} XP to next level</span>
        ) : (
          <span className="text-accent">Max level</span>
        )}
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-hover/80 ring-1 ring-border/50">
        <div
          className="xp-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary-hover to-accent shadow-sm shadow-primary/40"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
