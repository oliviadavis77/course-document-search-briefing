export type DeadlineState = "on-track" | "due-soon" | "overdue";

export function deadlineState(dueAt: string, now: Date): DeadlineState {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    throw new Error("dueAt must be an ISO date-time");
  }

  const hoursRemaining = (due.getTime() - now.getTime()) / 3_600_000;
  if (hoursRemaining < 0) return "overdue";
  if (hoursRemaining <= 48) return "due-soon";
  return "on-track";
}
