import { cn } from "@/lib/utils";

type BadgePillProps = {
  name: string;
  icon?: string | null;
  className?: string;
};

export function BadgePill({ name, icon, className }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-gradient-to-r from-accent/15 to-primary/10 px-3 py-1 text-sm font-medium text-accent shadow-sm shadow-accent/10 transition hover:border-accent/70 hover:shadow-accent/20",
        className,
      )}
    >
      {icon ? <span className="text-base">{icon}</span> : null}
      {name}
    </span>
  );
}
