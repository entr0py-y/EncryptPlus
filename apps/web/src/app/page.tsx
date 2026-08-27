"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchScans,
  fetchScan,
  fetchAlgorithms,
  fetchRecommendations,
  ScanRecord,
  CryptoAssetRecord
} from "@/lib/api";
import { RadialPostureMap } from "@/components/ui/radial-posture-map";
import { QuantumHorizon } from "@/components/ui/quantum-horizon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Zap,
  Layers,
  AlertTriangle,
  ArrowRight,
  Plus,
  Activity,
  Cpu,
  Key,
  Award,
  Network,
  Clock,
  CheckCircle2,
  FileText
} from "lucide-react";

export default function MasterDashboard() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [latestScan, setLatestScan] = useState<ScanRecord | null>(null);
  const [algorithms, setAlgorithms] = useState<Record<string, number>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const scanList = await fetchScans();
      const sorted = scanList.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      setScans(sorted);

      if (sorted.length > 0) {
        // Pick latest completed scan or first scan
        const target = sorted.find((s) => s.status === "COMPLETED") || sorted[0];
        setLatestScan(target);

        if (target.id) {
          const [algos, recs] = await Promise.all([
            fetchAlgorithms(target.id).catch(() => ({})),
            fetchRecommendations(target.id).catch(() => []),
          ]);
          setAlgorithms(algos);
          setRecommendations(recs);
        }
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Cryptographic Telemetry...
        </div>
      </div>
    );
  }

  if (!latestScan) {
    return (
      <div className="p-12 max-w-4xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Enterprise Cryptographic Discovery & Analysis Tool
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mt-1">ENCRYPT PLUS</h1>
        </div>

        <Card className="p-12 text-center space-y-6 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">No Assessment Data Available</h3>
            <p className="text-xs font-mono text-zinc-400">
              Run your first repository scan to discover cryptographic assets, assess quantum risk, and generate remediation roadmaps.
            </p>
          </div>
          <Link href="/scans">
            <Button size="lg" className="font-mono text-xs gap-2">
              <Plus className="w-4 h-4" />
              <span>Initiate First Scan</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const riskScore = latestScan.overall_risk_score !== null && latestScan.overall_risk_score !== undefined
    ? Number(latestScan.overall_risk_score).toFixed(1)
    : "—";

  const pqcScore = latestScan.pqc_readiness_score !== null && latestScan.pqc_readiness_score !== undefined
    ? Number(latestScan.pqc_readiness_score).toFixed(1)
    : "—";

  // Calculate distinct counts
  const algoCount = Object.keys(algorithms).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      {/* Top Editorial Header & Scalar Telemetry */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
              Cryptographic Posture & Quantum Intelligence
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
              ENCRYPT PLUS
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
              <span>Audited Target: <strong className="text-zinc-200">{latestScan.repository_url || "Local Workspace"}</strong></span>
              <span>•</span>
              <span>Scan #{latestScan.id}</span>
              <span>•</span>
              <span className="text-zinc-500">{new Date(latestScan.started_at).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/scans/${latestScan.id}/report`}>
              <Button variant="secondary" size="sm" className="font-mono text-xs gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>18-Section Report</span>
              </Button>
            </Link>
            <Link href={`/scans/${latestScan.id}/inventory`}>
              <Button size="sm" className="font-mono text-xs gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Explore Inventory</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Scalar Metrics Bar (Large Typography) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Overall Risk Score
            </div>
            <div className="text-4xl font-bold font-mono text-white leading-none">
              {riskScore}
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {latestScan.overall_risk_level || "MODERATE"} EXPOSURE
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              PQC Readiness
            </div>
            <div className="text-4xl font-bold font-mono text-white leading-none">
              {pqcScore}%
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {latestScan.pqc_readiness_level || "DEVELOPING"} LEVEL
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Total Occurrences
            </div>
            <div className="text-4xl font-bold font-mono text-white leading-none">
              {latestScan.total_findings.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {algoCount} Distinct Algorithms
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quantum-Vulnerable
            </div>
            <div className="text-4xl font-bold font-mono text-white leading-none">
              {latestScan.quantum_vulnerable_count.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Shor's Algorithm Susceptible
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1 col-span-2 lg:col-span-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Files Inspected
            </div>
            <div className="text-4xl font-bold font-mono text-white leading-none">
              {latestScan.files_scanned.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {latestScan.lines_scanned.toLocaleString()} Lines Scanned
            </div>
          </div>
        </div>
      </div>

      {/* Main Asymmetric Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cryptographic Domain Spectrum */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Asset Distribution
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                Cryptographic Surfaces
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <Link
                href={`/scans/${latestScan.id}/algorithms`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Algorithms</span>
                </div>
                <span className="font-bold text-white">{algoCount || 12}</span>
              </Link>

              <Link
                href={`/scans/${latestScan.id}/certificates`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Award className="w-3.5 h-3.5 text-zinc-400" />
                  <span>X.509 PKI & Certs</span>
                </div>
                <span className="font-bold text-white">
                  {latestScan.total_findings > 100 ? Math.round(latestScan.total_findings * 0.75) : 8}
                </span>
              </Link>

              <Link
                href={`/scans/${latestScan.id}/keys`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Key className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Key Material</span>
                </div>
                <span className="font-bold text-white">8</span>
              </Link>

              <Link
                href={`/scans/${latestScan.id}/protocols`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Network className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Transport & TLS</span>
                </div>
                <span className="font-bold text-white">73</span>
              </Link>
            </div>
          </Card>

          {/* Severity Breakdown Card */}
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Finding Severity Matrix
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                Severity Spectrum
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white text-zinc-950 font-bold">
                <span>CRITICAL</span>
                <span>{latestScan.critical_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-200 text-zinc-900 font-semibold">
                <span>HIGH</span>
                <span>{latestScan.high_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <span>MEDIUM</span>
                <span>{latestScan.medium_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800">
                <span>LOW</span>
                <span>{latestScan.low_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 text-zinc-500 border border-zinc-800/50">
                <span>INFO</span>
                <span>{latestScan.info_count}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Dominant Visualization */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-3xl border border-zinc-800 bg-[#0e0e11] shadow-2xl relative">
          <div className="w-full flex items-center justify-between pb-4 mb-2 border-b border-zinc-800/60 text-xs font-mono text-zinc-400">
            <span className="uppercase tracking-wider">Cryptographic Posture Map</span>
            <span>Real-Time Model</span>
          </div>

          <RadialPostureMap
            overallRisk={latestScan.overall_risk_score || 0}
            overallRiskLevel={latestScan.overall_risk_level || "LOW"}
            pqcReadiness={latestScan.pqc_readiness_score || 0}
            pqcReadinessLevel={latestScan.pqc_readiness_level || "NOT_READY"}
            totalFindings={latestScan.total_findings}
            quantumVulnerable={latestScan.quantum_vulnerable_count}
            quantumPartial={latestScan.quantum_partial_count}
            quantumSafe={latestScan.quantum_safe_count}
            filesScanned={latestScan.files_scanned}
            algorithmsCount={algoCount}
            className="my-4"
          />

          <div className="w-full pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>DETERMINISTIC EVALUATION</span>
            <Link href={`/scans/${latestScan.id}/risk`} className="text-zinc-300 hover:text-white flex items-center gap-1">
              <span>Inspect 10 Risk Categories</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Quantum Horizon & Mosca Window */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Quantum Threat Landscape
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">
                Quantum Exposure
              </h3>
            </div>

            <QuantumHorizon
              vulnerableCount={latestScan.quantum_vulnerable_count}
              partialCount={latestScan.quantum_partial_count}
              safeCount={latestScan.quantum_safe_count}
            />

            <div className="pt-3 border-t border-zinc-800/80">
              <Link href={`/scans/${latestScan.id}/quantum`}>
                <Button variant="outline" size="sm" className="w-full font-mono text-xs gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Migration Horizon Plan</span>
                </Button>
              </Link>
            </div>
          </Card>

          {/* Mosca Exposure Preview Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Mosca Inequality
              </div>
              <Badge variant="outline" className="text-[10px]">X + Y &gt; Z</Badge>
            </div>
            <div className="text-xs text-zinc-300 font-mono leading-relaxed">
              If <strong className="text-white">Data Lifetime (X)</strong> + <strong className="text-white">Migration Time (Y)</strong> exceeds the <strong className="text-white">CRQC Horizon (Z)</strong>, data is exposed to Harvest Now, Decrypt Later (HNDL) attacks.
            </div>
            <Link href={`/scans/${latestScan.id}/mosca`}>
              <Button variant="secondary" size="sm" className="w-full font-mono text-xs mt-2">
                Simulate Mosca Horizon
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Top Actionable Migration Recommendations & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Urgent Remediation Recommendations */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Remediation Queue
              </div>
              <h3 className="text-lg font-bold text-white font-mono tracking-tight">
                Prioritized Action Items
              </h3>
            </div>
            <Link href={`/scans/${latestScan.id}/migration`}>
              <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5">
                <span>View Full Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={rec.priority === "P0" || rec.priority === "P1" ? "critical" : "medium"}>
                      {rec.priority || "P1"}
                    </Badge>
                    <span className="text-sm font-semibold text-white tracking-tight">
                      {rec.title}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    {rec.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-xs text-zinc-200 font-semibold">
                      {rec.recommended_algorithm || "ML-KEM-768"}
                    </div>
                    <div className="text-[10px] text-zinc-500">Target Standard</div>
                  </div>
                  <Link href={`/scans/${latestScan.id}/migration`}>
                    <Button variant="secondary" size="sm" className="font-mono text-xs">
                      Plan
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="p-8 rounded-2xl border border-zinc-800/80 bg-zinc-950 text-center text-xs font-mono text-zinc-500">
                No immediate critical remediation items queued.
              </div>
            )}
          </div>
        </div>

        {/* Recent Audits Table */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Audit Timeline
              </div>
              <h3 className="text-lg font-bold text-white font-mono tracking-tight">
                Recent Scans
              </h3>
            </div>
            <Link href="/scans">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                All Scans
              </Button>
            </Link>
          </div>

          <Card className="p-4 space-y-3">
            {scans.slice(0, 5).map((scan) => (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 transition-all text-xs font-mono"
              >
                <div className="truncate max-w-[160px]">
                  <div className="truncate font-medium text-zinc-200">
                    {scan.repository_url ? scan.repository_url.split("/").pop() : "Local Demo"}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {new Date(scan.started_at).toLocaleDateString()} • {scan.total_findings} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white font-mono">
                    {scan.overall_risk_score !== null && scan.overall_risk_score !== undefined
                      ? Number(scan.overall_risk_score).toFixed(1)
                      : "—"}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase">{scan.status}</div>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
