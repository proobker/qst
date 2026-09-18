import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted transition focus:border-primary focus:outline-none";

const inputSizes = {
  md: "h-11 px-3",
  sm: "px-3 py-2",
} as const;

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: keyof typeof inputSizes;
};

export function Input({ className, size = "md", ...props }: InputProps) {
  return <input className={cn(inputBase, inputSizes[size], className)} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: keyof typeof inputSizes;
};

export function Textarea({ className, size = "md", ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(inputBase, "min-h-20", inputSizes[size], className)}
      {...props}
    />
  );
}

type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium tracking-wide text-muted uppercase"
        >
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}