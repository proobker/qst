import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section";
};

export function GlassCard({ children, className, hover = false, as: Tag = "div" }: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "glass-card rounded-2xl",
        hover && "glass-card-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
