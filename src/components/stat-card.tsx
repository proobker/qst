import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
};

export function StatCard({ label, value, subtext, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card glass-card-hover rounded-2xl p-4",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gradient-subtle">{value}</p>
      {subtext ? <p className="mt-0.5 text-xs text-muted">{subtext}</p> : null}
    </div>
  );
}
