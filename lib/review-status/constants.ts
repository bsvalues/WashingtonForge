/** Shared review-status constants — safe to import from client and server. */

export const REVIEW_STATUSES = ["unreviewed", "in_review", "needs_followup", "reviewed"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const DEFAULT_REVIEW_STATUS: ReviewStatus = "unreviewed";

export const MAX_CHANGE_NOTE_LENGTH = 2000;

/** Human-readable labels for the status pill / dropdown. */
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: "Unreviewed",
  in_review: "In review",
  needs_followup: "Needs follow-up",
  reviewed: "Reviewed",
};

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}
