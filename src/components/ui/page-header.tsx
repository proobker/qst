import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn("glass-card relative overflow-hidden rounded-2xl p-6", className)}>
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--glow-primary)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full opacity-25 blur-2xl"
        style={{ background: "var(--glow-accent)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight text-gradient sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </header>
  );
}
