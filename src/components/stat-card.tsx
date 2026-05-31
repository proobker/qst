import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
};

export function StatCard({ label, value, subtext, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      {subtext ? <p className="mt-0.5 text-xs text-muted">{subtext}</p> : null}
    </div>
  );
}
