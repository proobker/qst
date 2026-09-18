import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, action, children, className }: PageHeaderProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm leading-6 text-muted sm:mt-2">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}