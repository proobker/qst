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
        "inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-medium text-accent",
        className,
      )}
    >
      {icon ? <span>{icon}</span> : null}
      {name}
    </span>
  );
}
