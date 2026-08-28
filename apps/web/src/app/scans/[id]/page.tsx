"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchScan,
  fetchScanInventory,
  fetchScanFindings,
  fetchScores,
  fetchRecommendations,
  fetchScanReport,
  ScanRecord,
  CryptoAssetRecord
} from "@/lib/api";
import { RadialScrollNav } from "@/components/ui/radial-scroll-nav";
import { RadialPostureMap } from "@/components/ui/radial-posture-map";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCode,
  AlertCircle,
  Loader2,
  Download,
  ArrowRight,
  Clock,
  Shield,
  Layers,
  Zap,
  CheckCircle2
} from "lucide-react";

export default function LongFormAssessmentPage() {
  const { id } = useParams();
  const router = useRouter();

  // State
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [inventory, setInventory] = useState<CryptoAssetRecord[]>([]);
  const [findings, setFindings] = useState<CryptoAssetRecord[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Table filters & pagination for inventory
  const [invSearch, setInvSearch] = useState("");
  const [invType, setInvType] = useState("ALL");
  const [invPage, setInvPage] = useState(1);
  const invPageSize = 15;

  // Table filters for findings
  const [findSearch, setFindSearch] = useState("");
  const [findSeverity, setFindSeverity] = useState("ALL");
  const [findPage, setFindPage] = useState(1);
  const findPageSize = 12;

  // Selected asset for drawer
  const [inspectedAsset, setInspectedAsset] = useState<CryptoAssetRecord | null>(null);

  const loadAllData = async () => {
    if (!id) return;
    try {
      const s = await fetchScan(id as string);
      setScan(s);

      if (s.status === "COMPLETED") {
        const [invList, findList, scs, recs, rep] = await Promise.all([
          fetchScanInventory(id as string).catch(() => []),
          fetchScanFindings(id as string).catch(() => []),
          fetchScores(id as string).catch(() => ({})),
          fetchRecommendations(id as string).catch(() => []),
          fetchScanReport(id as string).catch(() => null),
        ]);
        setInventory(invList);
        setFindings(findList);
        setScores(scs);
        setRecommendations(recs);
        setReport(rep);
      }
    } catch (err) {
      console.error("Failed loading assessment data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const interval = setInterval(() => {
      if (scan && (scan.status === "COMPLETED" || scan.status === "FAILED")) {
        clearInterval(interval);
      } else {
        loadAllData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, scan?.status]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((a) => {
      const matchQ =
        invSearch === "" ||
        (a.algorithm && a.algorithm.toLowerCase().includes(invSearch.toLowerCase())) ||
        (a.file_path && a.file_path.toLowerCase().includes(invSearch.toLowerCase())) ||
        (a.category && a.category.toLowerCase().includes(invSearch.toLowerCase()));

      const matchT =
        invType === "ALL" || (a.asset_type || "").toUpperCase() === invType.toUpperCase();

      return matchQ && matchT;
    });
  }, [inventory, invSearch, invType]);

  const paginatedInventory = useMemo(() => {
    const start = (invPage - 1) * invPageSize;
    return filteredInventory.slice(start, start + invPageSize);
  }, [filteredInventory, invPage]);

  const totalInvPages = Math.ceil(filteredInventory.length / invPageSize) || 1;

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchQ =
        findSearch === "" ||
        (f.algorithm && f.algorithm.toLowerCase().includes(findSearch.toLowerCase())) ||
        (f.file_path && f.file_path.toLowerCase().includes(findSearch.toLowerCase())) ||
        (f.finding_type && f.finding_type.toLowerCase().includes(findSearch.toLowerCase()));

      const matchS =
        findSeverity === "ALL" || (f.severity || "").toUpperCase() === findSeverity.toUpperCase();

      return matchQ && matchS;
    });
  }, [findings, findSearch, findSeverity]);

  const paginatedFindings = useMemo(() => {
    const start = (findPage - 1) * findPageSize;
    return filteredFindings.slice(start, start + findPageSize);
  }, [filteredFindings, findPage]);

  const totalFindPages = Math.ceil(filteredFindings.length / findPageSize) || 1;

  if (loading && !scan) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        <div className="text-xs text-zinc-500 uppercase tracking-widest">
          Loading Security Assessment...
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-16 text-center text-xs font-sans text-zinc-500 space-y-4">
        <div>Scan #{id} could not be located.</div>
        <Link href="/">
          <Button variant="outline" size="sm">Return to Landing</Button>
        </Link>
      </div>
    );
  }

  const isRunning = scan.status && scan.status !== "COMPLETED" && scan.status !== "FAILED";
  const isFailed = scan.status === "FAILED";

  // SCAN PROGRESS SCREEN
  if (isRunning) {
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

    const repoDisplayName = scan.repository_url
      ? scan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
      : "Local Repository";

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 select-none max-w-lg mx-auto text-center space-y-8 font-sans">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            ENCRYPT PLUS
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Analyzing repository
          </h2>
          <div className="text-xs text-zinc-400">
            Repository: <strong className="text-white font-mono">{repoDisplayName}</strong>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
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

        <div className="w-full pt-6 border-t border-zinc-800/80 grid grid-cols-5 gap-2 text-center text-[10px] text-zinc-500 font-sans">
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
      <div className="p-16 max-w-lg mx-auto text-center space-y-6 font-sans">
        <h2 className="text-xl font-bold text-white">Scan Failed</h2>
        <p className="text-xs text-zinc-400">
          {scan.error_message || "Could not complete cryptographic analysis on the target repository."}
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">Scan Another Repository</Button>
        </Link>
      </div>
    );
  }

  const repoName = scan.repository_url
    ? scan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
    : "Local Codebase";

  const distinctAlgos = new Set(inventory.map((a) => a.algorithm).filter(Boolean)).size;

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans select-none">
      {/* Fixed Left Radial Navigation Scroll-Spy */}
      <RadialScrollNav />

      {/* Main Continuous Document Body */}
      <div className="max-w-4xl mx-auto px-6 xl:pl-28 py-12 md:py-16 space-y-24">
        {/* ========================================================================= */}
        {/* HERO CHAPTER: CRYPTOGRAPHIC POSTURE & OVERVIEW (#overview) */}
        {/* ========================================================================= */}
        <section id="overview" className="space-y-12 scroll-mt-20">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Enterprise Cryptographic Assessment
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {repoName}
              </h1>
              <p className="text-xs text-zinc-400 flex items-center gap-2 pt-0.5">
                <span>Scan <strong className="font-mono text-zinc-200">#{scan.id}</strong></span>
                <span>•</span>
                <span>{new Date(scan.started_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{scan.files_scanned} files ({scan.lines_scanned.toLocaleString()} lines)</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </Button>
            </div>
          </div>

          {/* 4 Primary Metric Numbers (Single Cohesive Bar) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-[#121214]">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Overall Risk
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {scan.overall_risk_score !== null ? Number(scan.overall_risk_score).toFixed(1) : "—"}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase">
                {scan.overall_risk_level || "MODERATE"} EXPOSURE
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                PQC Readiness
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {scan.pqc_readiness_score !== null ? `${Number(scan.pqc_readiness_score).toFixed(1)}%` : "—"}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase">
                {scan.pqc_readiness_level || "DEVELOPING"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Crypto Assets
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {scan.total_findings.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400">
                {distinctAlgos} Distinct Algorithms
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Quantum Vulnerable
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {scan.quantum_vulnerable_count.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400">
                Shor's Susceptible
              </div>
            </div>
          </div>

          {/* Central Posture Visualization Surface */}
          <div className="p-8 rounded-2xl border border-zinc-800/80 bg-[#121214] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-3 max-w-md text-left">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                Posture Assessment
              </div>
              <h2 className="text-xl font-bold text-white">
                Cryptographic Security Posture
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The repository operates with an overall risk rating of <strong className="text-white">{Number(scan.overall_risk_score || 0).toFixed(1)}/100</strong> ({scan.overall_risk_level || "MODERATE"}). There are <strong className="text-white">{scan.quantum_vulnerable_count}</strong> cryptographic mechanisms susceptible to quantum cryptanalysis (Shor's algorithm).
              </p>
            </div>

            <div className="shrink-0">
              <RadialPostureMap
                overallRisk={scan.overall_risk_score || 0}
                overallRiskLevel={scan.overall_risk_level || "LOW"}
                pqcReadiness={scan.pqc_readiness_score || 0}
              />
            </div>
          </div>

          {/* 01 Executive Summary Narrative */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/60">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-500 font-mono">01</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Executive Summary
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This assessment evaluated <strong className="text-white">{scan.files_scanned} files</strong> and identified <strong className="text-white">{scan.total_findings} cryptographic assets</strong> across symmetric ciphers, asymmetric key generation, digital signature routines, and transport security configurations. Long-term confidential data requires phased migration to post-quantum standards (NIST FIPS 203 ML-KEM and FIPS 204 ML-DSA).
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 02 CRYPTOGRAPHIC INVENTORY CHAPTER (#inventory) */}
        {/* ========================================================================= */}
        <section id="inventory" className="space-y-8 scroll-mt-20 pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-zinc-500 font-mono">02</span>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                  Cryptographic Inventory
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {inventory.length} total discovered assets • {distinctAlgos} algorithms • {scan.quantum_vulnerable_count} quantum-vulnerable
              </p>
            </div>
          </div>

          {/* Search & Type Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by algorithm, category, or file path..."
                value={invSearch}
                onChange={(e) => {
                  setInvSearch(e.target.value);
                  setInvPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-800 bg-[#121214] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-sans w-full sm:w-auto">
              {["ALL", "ALGORITHM", "CERTIFICATE", "KEY", "PROTOCOL"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setInvType(t);
                    setInvPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                    invType === t
                      ? "bg-white text-zinc-950 border-white font-bold"
                      : "bg-[#121214] border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-sans">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">Asset / Algorithm</th>
                    <th className="p-4 font-semibold">Classification</th>
                    <th className="p-4 font-semibold">File Location</th>
                    <th className="p-4 font-semibold">Quantum Posture</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {paginatedInventory.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setInspectedAsset(asset)}
                      className="hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-medium text-white max-w-[220px] truncate" title={asset.algorithm || ""}>
                        <div className="truncate font-mono text-[12px]">{asset.algorithm || "Undetermined"}</div>
                        {asset.category && (
                          <div className="text-[10px] text-zinc-500 font-sans">{asset.category}</div>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 text-xs">
                        {asset.asset_type || "UNKNOWN"}
                      </td>
                      <td className="p-4 text-zinc-400 max-w-[220px] truncate font-mono text-[11px]" title={asset.file_path || ""}>
                        <div className="truncate text-zinc-300">
                          {asset.file_path ? asset.file_path.split("/").pop() : "—"}:{asset.line_start || 1}
                        </div>
                      </td>
                      <td className="p-4">
                        {asset.quantum_status === "VULNERABLE" && (
                          <Badge variant="vulnerable">Quantum Vuln</Badge>
                        )}
                        {asset.quantum_status === "PARTIAL" && (
                          <Badge variant="partial">Weakened</Badge>
                        )}
                        {asset.quantum_status === "SAFE" && (
                          <Badge variant="safe">PQC Ready</Badge>
                        )}
                        {(!asset.quantum_status || asset.quantum_status === "UNKNOWN") && (
                          <Badge variant="muted">Undetermined</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedAsset(asset);
                          }}
                          className="text-zinc-400 hover:text-white text-xs underline-offset-4 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedInventory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500 text-xs">
                        No cryptographic assets match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-800 text-xs text-zinc-500">
              <div>
                Page {invPage} of {totalInvPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPage <= 1}
                  onClick={() => setInvPage(invPage - 1)}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPage >= totalInvPages}
                  onClick={() => setInvPage(invPage + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 03 FINDINGS & VULNERABILITIES CHAPTER (#findings) */}
        {/* ========================================================================= */}
        <section id="findings" className="space-y-8 scroll-mt-20 pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-zinc-500 font-mono">03</span>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                  Vulnerabilities & Findings
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {findings.length} total findings identified across source code AST patterns
              </p>
            </div>
          </div>

          {/* Severity Filter Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search findings by algorithm, location, or pattern..."
                value={findSearch}
                onChange={(e) => {
                  setFindSearch(e.target.value);
                  setFindPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-800 bg-[#121214] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    setFindSeverity(sev);
                    setFindPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                    findSeverity === sev
                      ? "bg-white text-zinc-950 border-white font-bold"
                      : "bg-[#121214] border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Horizontal Rows List */}
          <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] divide-y divide-zinc-800/60 overflow-hidden">
            {paginatedFindings.map((finding) => (
              <div
                key={finding.id}
                onClick={() => setInspectedAsset(finding)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Badge
                    variant={
                      finding.severity === "CRITICAL"
                        ? "critical"
                        : finding.severity === "HIGH"
                        ? "high"
                        : finding.severity === "MEDIUM"
                        ? "medium"
                        : "low"
                    }
                    className="shrink-0 w-20 text-center justify-center font-bold"
                  >
                    {finding.severity || "INFO"}
                  </Badge>

                  <div className="truncate">
                    <div className="font-semibold text-white font-mono text-[12px] truncate">
                      {finding.algorithm || finding.finding_type}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
                      {finding.file_path}:{finding.line_start || 1}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                  <div className="text-zinc-400 text-xs">
                    {finding.quantum_status === "VULNERABLE" ? (
                      <span className="text-zinc-300 font-semibold">Quantum Vuln</span>
                    ) : (
                      <span>Risk {finding.risk_score ? Number(finding.risk_score).toFixed(0) : "25"}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedAsset(finding);
                    }}
                    className="text-zinc-400 hover:text-white text-xs underline-offset-4 hover:underline"
                  >
                    View Evidence
                  </button>
                </div>
              </div>
            ))}

            {paginatedFindings.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No findings match the selected criteria.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-2 text-xs text-zinc-500">
            <div>
              Page {findPage} of {totalFindPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={findPage <= 1}
                onClick={() => setFindPage(findPage - 1)}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={findPage >= totalFindPages}
                onClick={() => setFindPage(findPage + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 04 RISK & IMPACT CHAPTER (#risk) */}
        {/* ========================================================================= */}
        <section id="risk" className="space-y-8 scroll-mt-20 pt-8 border-t border-zinc-800">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-500 font-mono">04</span>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                Risk & Security Scores
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Deterministic evaluation across 10 security and compliance dimensions
            </p>
          </div>

          {/* 10 Category Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(scores).map(([category, score]) => (
              <div
                key={category}
                className="p-4 rounded-xl border border-zinc-800/80 bg-[#121214] space-y-2"
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 truncate">
                  {category}
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {score}/100
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    style={{ width: `${score}%` }}
                    className="h-full bg-white rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 05 POST-QUANTUM READINESS & MOSCA CHAPTER (#quantum) */}
        {/* ========================================================================= */}
        <section id="quantum" className="space-y-8 scroll-mt-20 pt-8 border-t border-zinc-800">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-500 font-mono">05</span>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                Post-Quantum Readiness
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Evaluating Shor's algorithm threat, Grover's margin, and Mosca temporal inequality
            </p>
          </div>

          {/* QRAMM Score & 4 Quantitative Buckets */}
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-[#121214] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                  QRAMM Readiness Score
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-white font-mono mt-1">
                  {scan.pqc_readiness_score !== null ? Number(scan.pqc_readiness_score).toFixed(1) : "0.0"}%
                </div>
                <div className="text-xs text-zinc-400 uppercase mt-0.5">
                  STATUS: {scan.pqc_readiness_level || "DEVELOPING"}
                </div>
              </div>

              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed sm:text-right">
                Based on NIST FIPS 203/204 post-quantum standards and classical primitive elimination.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-800/80">
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#09090b]">
                <div className="text-[10px] text-zinc-500 uppercase">Shor Vulnerable</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">
                  {scan.quantum_vulnerable_count}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#09090b]">
                <div className="text-[10px] text-zinc-500 uppercase">Grover Weakened</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">
                  {scan.quantum_partial_count}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#09090b]">
                <div className="text-[10px] text-zinc-500 uppercase">PQC Ready</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">
                  {scan.quantum_safe_count}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#09090b]">
                <div className="text-[10px] text-zinc-500 uppercase">Undetermined</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">
                  {Math.max(0, scan.total_findings - scan.quantum_vulnerable_count - scan.quantum_partial_count - scan.quantum_safe_count)}
                </div>
              </div>
            </div>
          </div>

          {/* Mosca Assessment Surface */}
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-[#121214] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Mosca's Inequality Assessment (X + Y &gt; Z)
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">HNDL THREAT MODEL</Badge>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If data must remain secret for <strong className="text-white">X years</strong> and migration takes <strong className="text-white">Y years</strong>, and <strong className="text-white">X + Y &gt; Z (CRQC Arrival)</strong>, then encrypted communications are exposed today to <em>Harvest Now, Decrypt Later (HNDL)</em> adversaries.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 06 MIGRATION ROADMAP & REMEDIATION CHAPTER (#migration) */}
        {/* ========================================================================= */}
        <section id="migration" className="space-y-8 scroll-mt-20 pt-8 border-t border-zinc-800">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-500 font-mono">06</span>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                Migration Roadmap
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {recommendations.length} prioritized algorithm transitions to achieve Post-Quantum Compliance
            </p>
          </div>

          {/* Migration Rows */}
          <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] divide-y divide-zinc-800/60 overflow-hidden text-xs">
            {recommendations.map((rec, i) => (
              <div
                key={rec.id || i}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
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
                    <span className="font-semibold text-white truncate">{rec.title}</span>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-2 pt-0.5">
                    <span className="text-zinc-300 font-mono">{rec.current_algorithm || "Classical"}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-white font-semibold font-mono">{rec.recommended_algorithm || "ML-KEM-768"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:text-right">
                  <div className="text-zinc-500 text-xs">
                    {rec.finding_count || 1} occurrences
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {rec.status || "OPEN"}
                  </Badge>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No active migration roadmap items.
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 07 FULL 18-SECTION ASSESSMENT REPORT (#report) */}
        {/* ========================================================================= */}
        {report?.sections && (
          <section id="report" className="space-y-10 scroll-mt-20 pt-8 border-t border-zinc-800">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-zinc-500 font-mono">07</span>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                  Technical Audit Report
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Official 18-Section Cryptographic Security Audit Document
              </p>
            </div>

            <div className="space-y-8">
              {report.sections.map((sec: any) => (
                <article
                  key={sec.id}
                  className="space-y-3 pb-6 border-b border-zinc-800/60"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {sec.title}
                    </h3>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      SECTION {String(sec.id).padStart(2, "0")} / 18
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                    {sec.content}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Final Document Footer */}
        <footer className="pt-12 border-t border-zinc-800 text-center text-xs text-zinc-600 space-y-1 pb-16">
          <div>ENCRYPT PLUS • Enterprise Cryptographic Discovery & Analysis Tool</div>
          <div className="text-[10px] text-zinc-700">Deterministic Cryptographic Posture & Post-Quantum Intelligence Engine</div>
        </footer>
      </div>

      {/* Slide-out Inspection Drawer */}
      <DetailDrawer
        isOpen={!!inspectedAsset}
        onClose={() => setInspectedAsset(null)}
        title={inspectedAsset?.algorithm || "Asset Inspection"}
        subtitle={`${inspectedAsset?.file_path || ""}:${inspectedAsset?.line_start || 1}`}
      >
        {inspectedAsset && (
          <div className="space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-800 bg-[#121214]">
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Type</span>
                <div className="font-semibold text-white mt-0.5">{inspectedAsset.asset_type}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Quantum Posture</span>
                <div className="font-semibold text-white mt-0.5">{inspectedAsset.quantum_status || "Undetermined"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Key Parameter</span>
                <div className="font-semibold text-white mt-0.5 font-mono">{inspectedAsset.key_size ? `${inspectedAsset.key_size}-bit` : "Not Specified"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Severity</span>
                <div className="font-semibold text-white mt-0.5">{inspectedAsset.severity || "INFO"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                Code Evidence
              </div>
              <CodeEvidence
                filePath={inspectedAsset.file_path}
                lineNumber={inspectedAsset.line_start}
                matchText={inspectedAsset.match_text}
                contextText={inspectedAsset.context}
                sourceContextJson={inspectedAsset.source_context_json}
              />
            </div>

            {inspectedAsset.remediation && (
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214] space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Migration Guidance
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {inspectedAsset.remediation}
                </p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
