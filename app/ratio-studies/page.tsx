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
    <AppShell
      user={{ name: "Jane Doe", role: "Assessor", county: "Benton County" }}
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Ratio Studies
            </h1>
            <p className="text-muted-foreground">
              Run and view assessment ratio analysis reports
            </p>
          </div>
          <Button
            onClick={() => setIsRunModalOpen(true)}
            className="glass-btn-primary text-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Run New Study
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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
