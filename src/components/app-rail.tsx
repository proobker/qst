import Link from "next/link";
import { Trophy } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { XpBar } from "@/components/xp-bar";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { titleForLevel } from "@/lib/leveling";
import { cn } from "@/lib/utils";

type AppRailProps = {
  profile: {
    id: string;
    name: string;
    avatar: string | null;
    level: number;
    xp: number;
  };
  leaderboard: Array<{
    userId: string;
    name: string;
    avatar: string | null;
    level: number;
    rank: number;
  }>;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
};

export function AppRail({ profile, leaderboard, ctaHref, ctaLabel, className }: AppRailProps) {
  const topBuddies = leaderboard.filter((entry) => entry.userId !== profile.id).slice(0, 4);

  return (
    <aside className={cn("hidden space-y-4 lg:block", className)}>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="shrink-0">
            <Avatar name={profile.name} src={profile.avatar} size="md" />
          </Link>
          <div className="min-w-0">
            <Link
              href="/profile"
              className="block truncate font-semibold text-foreground hover:text-primary"
            >
              {profile.name}
            </Link>
            <p className="text-xs text-muted">
              Level {profile.level} · {titleForLevel(profile.level)}
            </p>
          </div>
        </div>
        <XpBar xp={profile.xp} level={profile.level} className="mt-4" />
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full")}>
            {ctaLabel}
          </Link>
        ) : null}
      </Card>

      {topBuddies.length > 0 ? (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Top questers</h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {topBuddies.map((entry) => (
              <li key={entry.userId} className="flex items-center gap-2.5">
                <span className="w-4 shrink-0 text-center text-xs font-bold text-muted">{entry.rank}</span>
                <Avatar name={entry.name} src={entry.avatar} size="sm" />
                <Link
                  href={`/profile/${entry.userId}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {entry.name}
                </Link>
                <span className="shrink-0 text-xs text-muted">Lv {entry.level}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </aside>
  );
}