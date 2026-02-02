"use client";

import React from "react";

import { useState } from "react";
import { X, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runRatioStudy, type RatioStudy } from "@/lib/api";

interface RunStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudyCreated: (study: RatioStudy) => void;
}

const currentYear = new Date().getFullYear();
const rollYears = [currentYear, currentYear - 1, currentYear - 2];

export function RunStudyModal({ isOpen, onClose, onStudyCreated }: RunStudyModalProps) {
  const [name, setName] = useState("");
  const [rollYear, setRollYear] = useState(currentYear.toString());
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRunning(true);

    try {
      const study = await runRatioStudy({
        name: name || `Ratio Study - ${rollYear}`,
        rollYear: parseInt(rollYear, 10),
      });
      onStudyCreated(study);
      // Reset form
      setName("");
      setRollYear(currentYear.toString());
    } catch (err) {
      console.error("[v0] Failed to run ratio study:", err);
      setError("Failed to start ratio study. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="glass-panel relative mx-4 w-full max-w-md rounded-xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Run New Ratio Study</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="study-name" className="text-foreground">
              Study Name
            </Label>
            <Input
              id="study-name"
              placeholder="e.g., Q1 2025 Residential Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-muted-foreground text-xs">
              Optional - a default name will be generated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roll-year" className="text-foreground">
              Roll Year
            </Label>
            <Select value={rollYear} onValueChange={setRollYear}>
              <SelectTrigger className="bg-input border-border/50 text-foreground w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                {rollYears.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-foreground">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-muted/20 border-border/30 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              This will compute ratio study statistics for all qualified sales in the selected roll
              year, including Median Ratio, COD, PRD, and PRB metrics.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isRunning}
              className="glass-btn border-border/50 text-foreground bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRunning}
              className="glass-btn-primary text-foreground"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Study
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
