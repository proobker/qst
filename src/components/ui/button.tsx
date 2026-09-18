import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary text-white",
        secondary:
          "border border-border text-muted hover:border-primary hover:text-primary",
        secondaryDanger:
          "border border-border text-muted hover:border-danger hover:text-danger",
        accent: "border border-accent/40 bg-accent/10 text-accent",
        success: "bg-success text-background hover:bg-success/90",
        danger: "bg-danger text-white hover:bg-danger-hover",
        ghost: "text-muted hover:text-primary",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm sm:py-3",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}