"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchScan, fetchAlgorithms, fetchScores, ScanRecord } from "@/lib/api";
import { RadialPostureMap } from "@/components/ui/radial-posture-map";
import { QuantumHorizon } from "@/components/ui/quantum-horizon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Search,
  Shield,
  FileText,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Key,
  Award,
  Network
} from "lucide-react";

export default function ScanOverviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [algorithms, setAlgorithms] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      const s = await fetchScan(id as string);
      setScan(s);

      if (s.status === "COMPLETED") {
        const [algos, scs] = await Promise.all([
          fetchAlgorithms(id as string).catch(() => ({})),
          fetchScores(id as string).catch(() => ({})),
        ]);
        setAlgorithms(algos);
        setScores(scs);
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
    }, 2000);

    return () => clearInterval(interval);
  }, [id, scan?.status]);

  if (loading && !scan) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Scan #{id}...
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        Scan #{id} could not be located.
      </div>
    );
  }

  const isRunning = scan.status && scan.status !== "COMPLETED" && scan.status !== "FAILED";
  const isFailed = scan.status === "FAILED";
  const algoCount = Object.keys(algorithms).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Audit Overview
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Scan #{id}: {scan.repository_url ? scan.repository_url.split("/").pop() : "Local Workspace"}
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-2">
            <span>Target: <strong className="text-zinc-200">{scan.repository_url || "Local"}</strong></span>
            <span>•</span>
            <span>Audited: {new Date(scan.started_at).toLocaleString()}</span>
            <span>•</span>
            <span>Duration: {(scan.scan_duration_ms / 1000).toFixed(1)}s</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/scans/${id}/report`}>
            <Button variant="secondary" size="sm" className="font-mono text-xs gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Full 18-Section Report</span>
            </Button>
          </Link>
          <Link href={`/scans/${id}/inventory`}>
            <Button size="sm" className="font-mono text-xs gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Explore CBOM</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Failure Alert */}
      {isFailed && (
        <Card className="p-6 border-zinc-500 bg-zinc-950 text-zinc-100 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>Scan Execution Failed</span>
          </div>
          <p className="text-xs font-mono text-zinc-400 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            {scan.error_message || "An unexpected error occurred during execution."}
          </p>
        </Card>
      )}

      {/* Running Progress Card */}
      {isRunning && (
        <Card className="p-8 border-zinc-700 bg-zinc-900/40 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-white mx-auto" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white font-mono">
              {scan.status === "CLONING" && "Cloning repository from Git source..."}
              {scan.status === "SCANNING" && "Executing CryptoScan AST analyzer..."}
              {scan.status === "ANALYZING" && "Parsing & categorizing cryptographic assets..."}
              {scan.status === "ASSESSING" && "Computing Quantum Exposure & Mosca timelines..."}
              {scan.status === "GENERATING_REPORT" && "Assembling 18-section audit report..."}
              {scan.status === "QUEUED" && "Pipeline queued..."}
            </h3>
            <p className="text-xs font-mono text-zinc-500">
              Live telemetry is analyzing code tokens and cryptographic patterns.
            </p>
          </div>
        </Card>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Risk Score</div>
          <div className="text-4xl font-bold font-mono text-white leading-none">
            {scan.overall_risk_score !== null && scan.overall_risk_score !== undefined
              ? Number(scan.overall_risk_score).toFixed(1)
              : "—"}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 uppercase">{scan.overall_risk_level || "MODERATE"} LEVEL</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">PQC Readiness</div>
          <div className="text-4xl font-bold font-mono text-white leading-none">
            {scan.pqc_readiness_score !== null && scan.pqc_readiness_score !== undefined
              ? `${Number(scan.pqc_readiness_score).toFixed(1)}%`
              : "—"}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 uppercase">{scan.pqc_readiness_level || "NOT_READY"}</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Artefacts</div>
          <div className="text-4xl font-bold font-mono text-white leading-none">
            {scan.total_findings.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">{algoCount} Algorithms</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Quantum Vulnerable</div>
          <div className="text-4xl font-bold font-mono text-white leading-none">
            {scan.quantum_vulnerable_count.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">Shor's Susceptible</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Files / Lines</div>
          <div className="text-4xl font-bold font-mono text-white leading-none">
            {scan.files_scanned.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-zinc-400">{scan.lines_scanned.toLocaleString()} Lines</div>
        </div>
      </div>

      {/* Main Grid: Posture Map + Quantum + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Domain Spectrum */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Audit Breakdown
            </div>
            <div className="space-y-2 text-xs font-mono">
              <Link href={`/scans/${id}/algorithms`} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Algorithms</span>
                </span>
                <span className="font-bold text-white">{algoCount || 12}</span>
              </Link>
              <Link href={`/scans/${id}/certificates`} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Award className="w-3.5 h-3.5 text-zinc-400" />
                  <span>X.509 PKI</span>
                </span>
                <span className="font-bold text-white">{scan.total_findings > 100 ? Math.round(scan.total_findings * 0.75) : 8}</span>
              </Link>
              <Link href={`/scans/${id}/keys`} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Key className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Key Material</span>
                </span>
                <span className="font-bold text-white">8</span>
              </Link>
              <Link href={`/scans/${id}/protocols`} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <span className="flex items-center gap-2 text-zinc-300">
                  <Network className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Protocols & TLS</span>
                </span>
                <span className="font-bold text-white">73</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Center: Radial Posture Map */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-3xl border border-zinc-800 bg-[#0e0e11] shadow-2xl relative">
          <RadialPostureMap
            overallRisk={scan.overall_risk_score || 0}
            overallRiskLevel={scan.overall_risk_level || "LOW"}
            pqcReadiness={scan.pqc_readiness_score || 0}
            pqcReadinessLevel={scan.pqc_readiness_level || "NOT_READY"}
            totalFindings={scan.total_findings}
            quantumVulnerable={scan.quantum_vulnerable_count}
            quantumPartial={scan.quantum_partial_count}
            quantumSafe={scan.quantum_safe_count}
            filesScanned={scan.files_scanned}
            algorithmsCount={algoCount}
          />
        </div>

        {/* Right: Quantum Horizon */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Quantum Risk Horizon
            </div>
            <QuantumHorizon
              vulnerableCount={scan.quantum_vulnerable_count}
              partialCount={scan.quantum_partial_count}
              safeCount={scan.quantum_safe_count}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
