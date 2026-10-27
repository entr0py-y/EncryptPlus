"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchRecommendations } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function MigrationPage() {
  const { id } = useParams();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecommendations(id as string)
        .then(setRecommendations)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500 dark:text-yellow-400" />
        <div className="text-xs font-mono text-black dark:text-white uppercase tracking-widest">
          Loading Migration Roadmap...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8 select-none font-mono">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="text-[10px] uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold">
          Remediation & Planning
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mt-1">
          PQC MIGRATION ROADMAP
        </h1>
        <p className="text-xs text-black dark:text-white mt-1 font-medium">
          {recommendations.length} prioritized algorithm transitions
        </p>
      </div>

      {/* Migration List (Clean Horizontal Rows) */}
      <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-[#121214] divide-y divide-zinc-200 dark:divide-zinc-800/60 overflow-hidden text-xs shadow-xl">
        {recommendations.map((rec, i) => (
          <div
            key={rec.id || i}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={
                    rec.priority === "P0"
                      ? "critical"
                      : rec.priority === "P1"
                      ? "high"
                      : "medium"
                  }
                  className="shrink-0"
                >
                  {rec.priority || "P1"}
                </Badge>
                <span className="font-semibold text-black dark:text-white truncate">{rec.title}</span>
              </div>
              <div className="text-black dark:text-white flex items-center gap-2 pt-1">
                <span className="text-black dark:text-white font-medium">{rec.current_algorithm || "Classical"}</span>
                <span className="text-yellow-500 dark:text-yellow-400 font-bold">→</span>
                <span className="text-yellow-500 dark:text-yellow-400 font-bold font-mono">{rec.recommended_algorithm || "ML-KEM-768"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 sm:text-right">
              <div className="text-black dark:text-white text-[11px] font-medium">
                {rec.finding_count || 1} occurrences
              </div>
              <Badge variant="outline" className="text-[10px]">
                {rec.status || "OPEN"}
              </Badge>
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="p-12 text-center text-black dark:text-white text-xs">
            No migration items queued.
          </div>
        )}
      </div>
    </div>
  );
}
