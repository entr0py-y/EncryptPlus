"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScores, fetchRisk, fetchScan } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export default function RiskAssessmentPage() {
  const { id } = useParams();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchScores(id as string).catch(() => ({})),
        fetchRisk(id as string).catch(() => ({})),
      ])
        .then(([scs, r]) => {
          setScores(scs);
          setRiskData(r);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const scoreEntries = Object.entries(scores);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Explainable Risk Scoring & Security Posture
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Categorical Risk & Health Assessment
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Deterministic evaluation across 10 independent cryptographic and governance dimensions.
          </p>
        </div>
        <div className="text-xs font-mono">
          <Badge variant="outline" className="text-xs py-1 px-3">
            OVERALL RISK: {riskData?.score !== undefined ? `${Number(riskData.score).toFixed(1)}/100` : "—"} ({riskData?.level || "MODERATE"})
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {scoreEntries.map(([category, score]) => {
          const isFailing = score < 50;
          const isWarning = score >= 50 && score < 80;

          return (
            <Card key={category} className="p-5 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {category} Security
                </div>
                <div className="text-3xl font-bold font-mono text-white leading-none">
                  {score}/100
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  style={{ width: `${score}%` }}
                  className="h-full bg-white transition-all duration-500"
                />
              </div>

              <div className="text-[10px] font-mono text-zinc-500">
                {score >= 80 ? "Optimal posture" : score >= 50 ? "Moderate exposure" : "Critical remediation required"}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
