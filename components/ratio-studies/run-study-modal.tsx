"use client";

import React from "react"

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

export function RunStudyModal({
  isOpen,
  onClose,
  onStudyCreated,
}: RunStudyModalProps) {
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
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Run New Ratio Study
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
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
            <p className="text-xs text-muted-foreground">
              Optional - a default name will be generated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roll-year" className="text-foreground">
              Roll Year
            </Label>
            <Select value={rollYear} onValueChange={setRollYear}>
              <SelectTrigger className="w-full bg-input border-border/50 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                {rollYears.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-foreground"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-sm text-muted-foreground">
              This will compute ratio study statistics for all qualified sales
              in the selected roll year, including Median Ratio, COD, PRD, and
              PRB metrics.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
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
