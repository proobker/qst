import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const FULL_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isFullEmailAddress(value: string): boolean {
  return FULL_EMAIL_PATTERN.test(value.trim());
}

export function percentFromVotes(approved: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return (approved / total) * 100;
}
