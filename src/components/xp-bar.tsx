import { LEVEL_THRESHOLDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type XpBarProps = {
  xp: number;
  level: number;
  className?: string;
};

export function XpBar({ xp, level, className }: XpBarProps) {
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === level)?.xp ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === level + 1)?.xp;
  const progress = nextThreshold
    ? Math.min(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-muted">
        <span>{xp} XP</span>
        {nextThreshold ? <span>{nextThreshold - xp} XP to next level</span> : <span>Max level</span>}
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
