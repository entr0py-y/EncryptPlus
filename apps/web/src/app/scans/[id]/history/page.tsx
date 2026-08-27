"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScans, fetchComparison, ScanRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ArrowRightLeft, TrendingDown, TrendingUp, ShieldCheck } from "lucide-react";

export default function HistoryComparisonPage() {
  const { id } = useParams();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [prevScanId, setPrevScanId] = useState<string>("");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans()
      .then((data) => {
        setScans(data);
        const otherScans = data.filter((s) => String(s.id) !== String(id));
        if (otherScans.length > 0) {
          const defaultPrev = String(otherScans[0].id);
          setPrevScanId(defaultPrev);
          fetchComparison(id as string, defaultPrev)
            .then(setComparison)
            .catch(console.error);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCompare = (targetPrevId: string) => {
    setPrevScanId(targetPrevId);
    if (id && targetPrevId) {
      fetchComparison(id as string, targetPrevId)
        .then(setComparison)
        .catch(console.error);
    }
  };

  const currentScan = scans.find((s) => String(s.id) === String(id));
  const previousScan = scans.find((s) => String(s.id) === String(prevScanId));

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Drift & Regression Tracking
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Historical Scan Comparison
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Comparing cryptographic posture delta, newly introduced primitives, and resolved vulnerabilities.
          </p>
        </div>
      </div>

      {/* Comparison Selector */}
      <div className="flex items-center gap-4 bg-[#121215] p-4 rounded-2xl border border-zinc-800 text-xs font-mono">
        <span className="text-zinc-400">Comparing Current Scan #{id} against:</span>
        <select
          value={prevScanId}
          onChange={(e) => handleCompare(e.target.value)}
          className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none"
        >
          {scans
            .filter((s) => String(s.id) !== String(id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                Scan #{s.id} — {s.repository_url ? s.repository_url.split("/").pop() : "Local"} ({new Date(s.started_at).toLocaleDateString()})
              </option>
            ))}
        </select>
      </div>

      {/* Delta Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Risk Score Delta
          </div>
          <div className="text-4xl font-bold font-mono text-white">
            {comparison?.risk_change !== undefined
              ? `${comparison.risk_change > 0 ? "+" : ""}${Number(comparison.risk_change).toFixed(1)}`
              : "0.0"}
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {currentScan?.overall_risk_score} vs {previousScan?.overall_risk_score}
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Occurrences Delta
          </div>
          <div className="text-4xl font-bold font-mono text-white">
            {comparison?.new_findings !== undefined
              ? `${comparison.new_findings > 0 ? "+" : ""}${comparison.new_findings}`
              : "0"}
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {currentScan?.total_findings} vs {previousScan?.total_findings}
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            PQC Readiness Delta
          </div>
          <div className="text-4xl font-bold font-mono text-white">
            {currentScan?.pqc_readiness_score !== null && previousScan?.pqc_readiness_score !== null
              ? `${(Number(currentScan?.pqc_readiness_score || 0) - Number(previousScan?.pqc_readiness_score || 0)).toFixed(1)}%`
              : "0.0%"}
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Progression across audit cycle
          </div>
        </Card>
      </div>
    </div>
  );
}
