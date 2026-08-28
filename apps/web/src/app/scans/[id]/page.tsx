"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchScan, fetchScanFindings, fetchRecommendations, ScanRecord, CryptoAssetRecord } from "@/lib/api";
import { RadialPostureMap } from "@/components/ui/radial-posture-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, FileCode, CheckCircle2 } from "lucide-react";

export default function ScanOverviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [findings, setFindings] = useState<CryptoAssetRecord[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      const s = await fetchScan(id as string);
      setScan(s);

      if (s.status === "COMPLETED") {
        const [fList, recList] = await Promise.all([
          fetchScanFindings(id as string).catch(() => []),
          fetchRecommendations(id as string).catch(() => []),
        ]);
        setFindings(Array.isArray(fList) ? fList : []);
        setRecommendations(Array.isArray(recList) ? recList : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      if (scan && (scan.status === "COMPLETED" || scan.status === "FAILED")) {
        clearInterval(interval);
      } else {
        loadData();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [id, scan?.status]);

  if (loading && !scan) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Scan #{id}...
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-16 text-center text-xs font-mono text-zinc-500 space-y-4">
        <div>Scan #{id} could not be located.</div>
        <Link href="/">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Return to Landing Page
          </Button>
        </Link>
      </div>
    );
  }

  const isRunning = scan.status && scan.status !== "COMPLETED" && scan.status !== "FAILED";
  const isFailed = scan.status === "FAILED";

  // Progress logic
  let progressPct = 20;
  let stageLabel = "Cloning repository";
  if (scan.status === "SCANNING") {
    progressPct = 40;
    stageLabel = "Discovering cryptographic assets";
  } else if (scan.status === "ANALYZING") {
    progressPct = 60;
    stageLabel = "Categorizing Cryptographic Bill of Materials (CBOM)";
  } else if (scan.status === "ASSESSING") {
    progressPct = 80;
    stageLabel = "Assessing Quantum Exposure & Mosca Window";
  } else if (scan.status === "GENERATING_REPORT") {
    progressPct = 95;
    stageLabel = "Assembling 18-Section Assessment Report";
  }

  // MINIMAL CALM PROGRESS SCREEN
  if (isRunning) {
    const repoDisplayName = scan.repository_url
      ? scan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
      : "Local Repository";

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 select-none max-w-lg mx-auto text-center space-y-8">
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            ENCRYPT PLUS
          </div>
          <h2 className="text-2xl font-bold font-mono text-white tracking-tight">
            Analyzing repository
          </h2>
          <div className="text-xs font-mono text-zinc-400">
            Repository: <strong className="text-white">{repoDisplayName}</strong>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>{stageLabel}</span>
            <span className="font-bold text-white">{progressPct}%</span>
          </div>

          <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 p-0.5">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-white rounded-full transition-all duration-500"
            />
          </div>
        </div>

        <div className="w-full pt-6 border-t border-zinc-800/80 grid grid-cols-5 gap-2 text-center text-[10px] font-mono text-zinc-500">
          <span className={progressPct >= 20 ? "text-white font-semibold" : ""}>Repository</span>
          <span className={progressPct >= 40 ? "text-white font-semibold" : ""}>Discovery</span>
          <span className={progressPct >= 60 ? "text-white font-semibold" : ""}>Assessment</span>
          <span className={progressPct >= 80 ? "text-white font-semibold" : ""}>Quantum</span>
          <span className={progressPct >= 95 ? "text-white font-semibold" : ""}>Report</span>
        </div>
      </div>
    );
  }

  // FAILED STATE
  if (isFailed) {
    return (
      <div className="p-16 max-w-lg mx-auto text-center space-y-6">
        <h2 className="text-xl font-bold text-white font-mono">Scan Failed</h2>
        <p className="text-xs font-mono text-zinc-400">
          {scan.error_message || "Could not complete cryptographic analysis on the target repository."}
        </p>
        <Link href="/">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Scan Another Repository
          </Button>
        </Link>
      </div>
    );
  }

  // CALM, FOCUSED POST-SCAN DASHBOARD
  const repoName = scan.repository_url
    ? scan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
    : "Local Codebase";

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 select-none">
      {/* 1. Header with Repository Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Audit Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-1">
            {repoName}
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            Scan #{scan.id} • {new Date(scan.started_at).toLocaleDateString()} • {scan.files_scanned} files inspected
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/scans/${id}/report`}>
            <Button variant="outline" size="sm" className="font-mono text-xs">
              View Report
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Primary Metrics (Single Cohesive Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-[#121214]">
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Overall Risk
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {scan.overall_risk_score !== null ? Number(scan.overall_risk_score).toFixed(1) : "—"}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">
            {scan.overall_risk_level || "MODERATE"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            PQC Readiness
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {scan.pqc_readiness_score !== null ? `${Number(scan.pqc_readiness_score).toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">
            {scan.pqc_readiness_level || "DEVELOPING"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Crypto Assets
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {scan.total_findings.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-zinc-400">
            Discovered Elements
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Quantum Vulnerable
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {scan.quantum_vulnerable_count.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-zinc-400">
            Shor's Susceptible
          </div>
        </div>
      </div>

      {/* 3. Central Cohesive Surface: Posture Gauge & Summary */}
      <div className="p-8 rounded-2xl border border-zinc-800/80 bg-[#121214] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-3 max-w-md text-left">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Posture Assessment
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            Cryptographic Exposure Summary
          </h2>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            {scan.quantum_vulnerable_count} cryptographic mechanisms in this repository are vulnerable to Shor's algorithm. Immediate migration is recommended for long-term secret confidentiality.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link href={`/scans/${id}/inventory`}>
              <Button size="sm" className="font-mono text-xs">
                Explore Inventory ({scan.total_findings})
              </Button>
            </Link>
            <Link href={`/scans/${id}/quantum`}>
              <Button variant="ghost" size="sm" className="font-mono text-xs text-zinc-400 hover:text-white">
                Quantum Analysis →
              </Button>
            </Link>
          </div>
        </div>

        <div className="shrink-0">
          <RadialPostureMap
            overallRisk={scan.overall_risk_score || 0}
            overallRiskLevel={scan.overall_risk_level || "LOW"}
            pqcReadiness={scan.pqc_readiness_score || 0}
          />
        </div>
      </div>

      {/* 4. Priority Findings Section (Clean Horizontal Rows) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Priority Attention
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Key Security Findings
            </h3>
          </div>
          <Link href={`/scans/${id}/findings`}>
            <Button variant="ghost" size="sm" className="font-mono text-xs text-zinc-400 hover:text-white">
              All Findings ({findings.length}) →
            </Button>
          </Link>
        </div>

        <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] divide-y divide-zinc-800/60 overflow-hidden">
          {findings.slice(0, 5).map((f) => (
            <Link
              key={f.id}
              href={`/scans/${id}/findings/${f.id}`}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/50 transition-colors text-xs font-mono"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge
                  variant={
                    f.severity === "CRITICAL"
                      ? "critical"
                      : f.severity === "HIGH"
                      ? "high"
                      : "medium"
                  }
                  className="shrink-0"
                >
                  {f.severity || "INFO"}
                </Badge>
                <div className="truncate">
                  <div className="font-semibold text-white truncate">
                    {f.algorithm || f.finding_type}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                    <FileCode className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span>{f.file_path}:{f.line_start || 1}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:text-right">
                <span className="text-zinc-400 font-medium">
                  {f.quantum_status === "VULNERABLE" ? "Quantum Vuln" : "Classical"}
                </span>
                <span className="text-zinc-500">→</span>
              </div>
            </Link>
          ))}

          {findings.length === 0 && (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs">
              No critical findings discovered.
            </div>
          )}
        </div>
      </div>

      {/* 5. Primary Migration Target Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Remediation
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Migration Roadmap
            </h3>
          </div>
          <Link href={`/scans/${id}/migration`}>
            <Button variant="ghost" size="sm" className="font-mono text-xs text-zinc-400 hover:text-white">
              Full Roadmap →
            </Button>
          </Link>
        </div>

        <div className="border border-zinc-800/80 rounded-2xl bg-[#121215] divide-y divide-zinc-800/60 overflow-hidden">
          {recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={rec.id || i}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant={rec.priority === "P0" || rec.priority === "P1" ? "critical" : "medium"}>
                    {rec.priority || "P1"}
                  </Badge>
                  <span className="font-semibold text-white">{rec.title}</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {rec.current_algorithm || "Classical"} → <strong className="text-zinc-300">{rec.recommended_algorithm || "ML-KEM-768"}</strong>
                </div>
              </div>

              <div className="text-zinc-500 text-[11px]">
                {rec.finding_count || 1} occurrences
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs">
              No migration recommendations pending.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
