import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function percentFromVotes(approved: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return (approved / total) * 100;
}
