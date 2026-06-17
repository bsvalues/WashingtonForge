"use client";

import { useState, useEffect, useCallback } from "react";
import { MAX_NOTE_LENGTH } from "@/lib/notes/constants";

interface ParcelNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface ParcelNotesProps {
  parcelId: string;
  parcelSitus?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function ParcelNotes({ parcelId, parcelSitus }: ParcelNotesProps) {
  const [text, setText] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes?parcelId=${encodeURIComponent(parcelId)}`);
      const data = (await res.json()) as { notes: ParcelNote[] };
      const note = data.notes[0];
      if (note) {
        setText(note.text);
        setLastSaved(note.updatedAt);
      } else {
        setText("");
        setLastSaved(null);
      }
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelId, text }),
      });
      const data = (await res.json()) as { note: ParcelNote };
      setLastSaved(data.note.updatedAt);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  if (loading) {
    return <div className="text-muted-foreground px-4 py-3 text-xs">Loading…</div>;
  }

  return (
    <div className="flex h-full flex-col gap-2 px-4 py-3">
      {parcelSitus && <p className="text-muted-foreground truncate text-xs">{parcelSitus}</p>}
      <textarea
        className="border-border/50 bg-muted/20 text-foreground placeholder:text-muted-foreground flex-1 resize-none rounded border p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        placeholder="Assessor notes for this parcel…"
        maxLength={MAX_NOTE_LENGTH}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaveState("idle");
        }}
      />
      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
        Local server storage · not enterprise-durable
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {lastSaved ? `Last saved ${new Date(lastSaved).toLocaleString()}` : "Unsaved"}
        </span>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Error — retry"
                : "Save note"}
        </button>
      </div>
    </div>
  );
}
