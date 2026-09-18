import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const cardVariants = cva(
  "rounded-xl border bg-surface shadow-card",
  {
    variants: {
      variant: {
        default: "border-border",
        accent: "border-accent/40 bg-accent/10",
        danger: "border-danger/40 bg-danger/10",
      },
      interactive: {
        true: "transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  },
);

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export function Card({ className, variant, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, interactive }), className)} {...props} />;
}