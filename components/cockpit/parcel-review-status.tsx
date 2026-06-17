"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
  MAX_CHANGE_NOTE_LENGTH,
  type ReviewStatus,
} from "@/lib/review-status/constants";

interface ReviewTransition {
  from?: ReviewStatus;
  to: ReviewStatus;
  note?: string;
  at: string;
  by?: string;
}

interface ParcelReviewRecord {
  parcelId: string;
  status: ReviewStatus;
  changeNote?: string;
  updatedAt: string;
  updatedBy?: string;
  history: ReviewTransition[];
}

interface ParcelReviewStatusProps {
  parcelId: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const EPOCH = new Date(0).toISOString();

export function ParcelReviewStatus({ parcelId }: ParcelReviewStatusProps) {
  const [record, setRecord] = useState<ParcelReviewRecord | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ReviewStatus>("unreviewed");
  const [note, setNote] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/review-status?parcelId=${encodeURIComponent(parcelId)}`);
      const data = (await res.json()) as { record: ParcelReviewRecord };
      setRecord(data.record);
      setPendingStatus(data.record.status);
      setNote("");
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = record !== null && (pendingStatus !== record.status || note.trim() !== "");

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/review-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId,
          status: pendingStatus,
          note: note.trim() === "" ? undefined : note.trim(),
        }),
      });
      const data = (await res.json()) as { record: ParcelReviewRecord };
      setRecord(data.record);
      setNote("");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  if (loading || !record) {
    return <div className="text-muted-foreground px-4 py-3 text-xs">Loading…</div>;
  }

  const everReviewed = record.updatedAt !== EPOCH;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      {/* Current status + selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-muted-foreground text-[10px] tracking-wide uppercase">
          Review status
        </label>
        <Select
          value={pendingStatus}
          onValueChange={(v) => {
            setPendingStatus(v as ReviewStatus);
            setSaveState("idle");
          }}
        >
          <SelectTrigger className="h-8 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">
                {REVIEW_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Change note — shown when changing status */}
      {pendingStatus !== record.status && (
        <textarea
          className="border-border/50 bg-muted/20 text-foreground placeholder:text-muted-foreground resize-none rounded border p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows={2}
          maxLength={MAX_CHANGE_NOTE_LENGTH}
          placeholder="Reason / change note (optional)…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {everReviewed
            ? `Last updated ${new Date(record.updatedAt).toLocaleString()}`
            : "Never reviewed"}
        </span>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saveState === "saving"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Error — retry"
                : "Update status"}
        </button>
      </div>

      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
        Local server storage · not enterprise-durable
      </p>

      {/* Transition history, newest first */}
      {record.history.length > 0 && (
        <div className="border-border/30 mt-1 flex flex-col gap-2 border-t pt-2">
          <span className="text-muted-foreground text-[10px] tracking-wide uppercase">History</span>
          <ul className="flex flex-col gap-1.5">
            {[...record.history].reverse().map((t, i) => (
              <li key={`${t.at}-${i}`} className="text-xs">
                <span className="text-foreground">
                  {t.from ? `${REVIEW_STATUS_LABELS[t.from]} → ` : ""}
                  {REVIEW_STATUS_LABELS[t.to]}
                </span>
                <span className="text-muted-foreground"> · {new Date(t.at).toLocaleString()}</span>
                {t.note && <div className="text-muted-foreground italic">“{t.note}”</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
