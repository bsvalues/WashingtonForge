"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { RatioStudyList } from "@/components/ratio-studies/ratio-study-list";
import { RunStudyModal } from "@/components/ratio-studies/run-study-modal";
import { StudyResults } from "@/components/ratio-studies/study-results";
import { getRatioStudies, type RatioStudy } from "@/lib/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RatioStudiesPage() {
  const [studies, setStudies] = useState<RatioStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<RatioStudy | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudies() {
      try {
        const data = await getRatioStudies();
        setStudies(data);
        // Auto-select the first completed study
        const completed = data.find((s) => s.status === "completed");
        if (completed) {
          setSelectedStudy(completed);
        }
      } catch (err) {
        console.error("[v0] Failed to load ratio studies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudies();
  }, []);

  const handleStudyCreated = (study: RatioStudy) => {
    setStudies((prev) => [study, ...prev]);
    setSelectedStudy(study);
    setIsRunModalOpen(false);
  };

  return (
    <AppShell user={{ name: "Jane Doe", role: "Assessor", countyName: "Benton County" }}>
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-2xl font-semibold">Ratio Studies</h1>
            <p className="text-muted-foreground">Run and view assessment ratio analysis reports</p>
          </div>
          <Button
            onClick={() => setIsRunModalOpen(true)}
            className="tf-glass-btn tf-glass-btn--primary text-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Run New Study
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Studies List */}
          <div className="lg:col-span-1">
            <RatioStudyList
              studies={studies}
              selectedStudy={selectedStudy}
              onSelectStudy={setSelectedStudy}
              isLoading={isLoading}
            />
          </div>

          {/* Study Results */}
          <div className="lg:col-span-2">
            <StudyResults study={selectedStudy} />
          </div>
        </div>
      </div>

      {/* Run Study Modal */}
      <RunStudyModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onStudyCreated={handleStudyCreated}
      />
    </AppShell>
  );
}
