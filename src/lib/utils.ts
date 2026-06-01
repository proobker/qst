import { clsx, type ClassValue } from "clsx";
import { APPROVAL_THRESHOLD_PERCENT } from "@/lib/constants";

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

export function meetsApprovalThreshold(approved: number, total: number): boolean {
  return total > 0 && percentFromVotes(approved, total) >= APPROVAL_THRESHOLD_PERCENT;
}

export function tallyFriendVotes(
  votes: Array<{ user_id: string; vote: boolean }>,
  postOwnerId: string,
): { approved: number; total: number; percent: number } {
  const friendVotes = votes.filter((row) => row.user_id !== postOwnerId);
  const approved = friendVotes.filter((row) => row.vote).length;
  const total = friendVotes.length;
  return { approved, total, percent: percentFromVotes(approved, total) };
}
