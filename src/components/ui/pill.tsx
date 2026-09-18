import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const pillVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium tracking-wide uppercase sm:text-xs",
  {
    variants: {
      variant: {
        neutral: "border-border text-muted",
        primary: "border-primary/40 bg-primary/10 text-primary",
        accent: "border-accent/40 bg-accent/10 text-accent",
        success: "border-success/40 bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type PillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants>;

export function Pill({ className, variant, ...props }: PillProps) {
  return <span className={cn(pillVariants({ variant }), className)} {...props} />;
}