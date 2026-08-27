"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchRecommendations } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

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

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Remediation & Migration Engineering
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Post-Quantum Migration Roadmap
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Prioritized algorithm transitions, replacement standards, and implementation effort estimates.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          <strong className="text-white">{recommendations.length}</strong> Migration Paths Engineered
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <Card key={rec.id || i} className="p-6 space-y-4 hover:border-zinc-700 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Badge variant={rec.priority === "P0" || rec.priority === "P1" ? "critical" : "medium"}>
                    {rec.priority || "P1"}
                  </Badge>
                  <h3 className="text-base font-bold text-white font-mono tracking-tight">
                    {rec.title}
                  </h3>
                </div>
                <p className="text-xs font-mono text-zinc-400">
                  {rec.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 shrink-0">
                <span>Affected Occurrences:</span>
                <strong className="text-white font-mono">{rec.finding_count || 1}</strong>
              </div>
            </div>

            {/* Algorithm Transition Flow Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950 gap-4 font-mono text-xs">
              <div>
                <div className="text-zinc-500 text-[10px]">CURRENT DEPLOYED MECHANISM</div>
                <div className="text-sm font-bold text-zinc-200 mt-0.5">{rec.current_algorithm || "Classical Primitive"}</div>
              </div>

              <ArrowRight className="w-5 h-5 text-zinc-500 shrink-0 hidden sm:block" />

              <div>
                <div className="text-zinc-500 text-[10px]">TARGET POST-QUANTUM STANDARD</div>
                <div className="text-sm font-bold text-white mt-0.5">{rec.recommended_algorithm || "ML-KEM-768"}</div>
              </div>

              <div className="text-right">
                <div className="text-zinc-500 text-[10px]">STATUS</div>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {rec.status || "OPEN / PLANNED"}
                </Badge>
              </div>
            </div>
          </Card>
        ))}

        {recommendations.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
            No active migration roadmap items.
          </div>
        )}
      </div>
    </div>
  );
}
