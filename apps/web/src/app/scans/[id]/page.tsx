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
import { RadialPostureMap } from "@/components/ui/radial-posture-map";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Printer,
  Search,
  ArrowLeft,
  ArrowRight,
  FileCode,
  AlertCircle,
  Loader2,
  Download,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  Lock,
  GitBranch,
  Play,
  RotateCw,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";

function cleanFilePath(path?: string | null): string {
  if (!path) return "—";
  return path.replace(/^.*\/ecdat_work_[^/]+\//, "").replace(/^\/tmp\/[^/]+\//, "");
}

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
          fetchScanInventory(id as string, { limit: 200 }).catch(() => []),
          fetchScanFindings(id as string, { limit: 200 }).catch(() => []),
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
    }, 2500);

    return () => clearInterval(interval);
  }, [id, scan?.status]);

  // Inventory filtering & pagination
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        invSearch === "" ||
        (item.algorithm && item.algorithm.toLowerCase().includes(invSearch.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(invSearch.toLowerCase())) ||
        (item.file_path && item.file_path.toLowerCase().includes(invSearch.toLowerCase()));

      const matchesType =
        invType === "ALL" ||
        (item.asset_type && item.asset_type.toUpperCase() === invType.toUpperCase());

      return matchesSearch && matchesType;
    });
  }, [inventory, invSearch, invType]);

  const paginatedInventory = useMemo(() => {
    const start = (invPage - 1) * invPageSize;
    return filteredInventory.slice(start, start + invPageSize);
  }, [filteredInventory, invPage]);

  const totalInvPages = Math.ceil(filteredInventory.length / invPageSize) || 1;

  // Findings filtering & pagination
  const filteredFindings = useMemo(() => {
    return findings.filter((item) => {
      const matchesSearch =
        findSearch === "" ||
        (item.algorithm && item.algorithm.toLowerCase().includes(findSearch.toLowerCase())) ||
        (item.file_path && item.file_path.toLowerCase().includes(findSearch.toLowerCase())) ||
        (item.finding_type && item.finding_type.toLowerCase().includes(findSearch.toLowerCase()));

      const matchesSeverity =
        findSeverity === "ALL" ||
        (item.severity && item.severity.toUpperCase() === findSeverity.toUpperCase());

      return matchesSearch && matchesSeverity;
    });
  }, [findings, findSearch, findSeverity]);

  const paginatedFindings = useMemo(() => {
    const start = (findPage - 1) * findPageSize;
    return filteredFindings.slice(start, start + findPageSize);
  }, [filteredFindings, findPage]);

  const totalFindPages = Math.ceil(filteredFindings.length / findPageSize) || 1;

  if (loading && !scan) {
    return (
      <div className="w-full px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[70vh] space-y-4 font-mono select-none">
        <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
        <div className="text-xs text-yellow-500/80 uppercase tracking-widest font-semibold">
          Loading Security Assessment...
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="w-full px-4 sm:px-6 py-20 text-center text-xs font-mono text-black dark:text-white space-y-5 select-none">
        <div>Scan #{id} could not be located or session has expired.</div>
        <Link href="/scans">
          <Button variant="outline" size="sm" className="font-mono text-xs border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/30 rounded-xl">
            Return to Dashboard
          </Button>
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
      <div className="w-full px-4 sm:px-6 py-12 min-h-[75vh] flex flex-col items-center justify-center select-none max-w-xl mx-auto text-center space-y-8 font-mono">
        <div className="p-8 sm:p-9 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-950/40 shadow-xl w-full space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold">
              ENCRYPT PLUS PIPELINE ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight font-mono">
              Analyzing repository
            </h2>
            <div className="text-xs text-black dark:text-white pt-1">
              Target: <strong className="text-yellow-500 dark:text-yellow-400 font-mono font-bold">{repoDisplayName}</strong>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs text-black dark:text-white font-mono">
              <span>{stageLabel}</span>
              <span className="font-bold text-yellow-500 dark:text-yellow-400">{progressPct}%</span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/60 overflow-hidden border-0 p-0">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-yellow-400 rounded-full transition-all duration-500 shadow-none"
              />
            </div>
          </div>

          <div className="w-full pt-4 border-t border-zinc-200 dark:border-zinc-800/70 grid grid-cols-5 gap-2 text-center text-[10px] text-black dark:text-white font-mono">
            <span className={progressPct >= 20 ? "text-yellow-500 dark:text-yellow-400 font-bold" : ""}>Clone</span>
            <span className={progressPct >= 40 ? "text-yellow-500 dark:text-yellow-400 font-bold" : ""}>AST</span>
            <span className={progressPct >= 60 ? "text-yellow-500 dark:text-yellow-400 font-bold" : ""}>CBOM</span>
            <span className={progressPct >= 80 ? "text-yellow-500 dark:text-yellow-400 font-bold" : ""}>Quantum</span>
            <span className={progressPct >= 95 ? "text-yellow-500 dark:text-yellow-400 font-bold" : ""}>Report</span>
          </div>
        </div>
      </div>
    );
  }

  // FAILED STATE
  if (isFailed) {
    return (
      <div className="w-full px-4 sm:px-6 py-16 max-w-lg mx-auto text-center space-y-6 font-mono select-none">
        <div className="p-8 rounded-2xl border border-rose-500/30 bg-white dark:bg-transparent shadow-xl space-y-4">
          <div className="text-[10px] text-yellow-500 dark:text-yellow-400 uppercase tracking-widest font-bold">Pipeline Error</div>
          <h2 className="text-2xl font-bold text-black dark:text-white font-mono">Scan Failed</h2>
          <p className="text-xs text-black dark:text-white leading-relaxed">
            {scan.error_message || "Could not complete cryptographic analysis on the target repository."}
          </p>
          <div className="pt-2">
            <Link href="/scans">
              <Button variant="outline" size="sm" className="font-mono text-xs border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/30 rounded-xl">
                Scan Another Repository
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const repoName = scan.repository_url
    ? scan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
    : "Local Codebase";

  const distinctAlgos = new Set(inventory.map((a) => a.algorithm).filter(Boolean)).size;

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & METADATA BAR (Matching Home Page) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <Link
            href="/scans"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Audited Repositories</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
              {repoName}
            </h1>
          </div>
          <p className="text-xs font-mono text-black dark:text-white mt-1 flex flex-wrap items-center gap-2">
            <span className="text-yellow-500 dark:text-yellow-400 font-semibold">Enterprise Cryptographic Assessment</span>
            <span>•</span>
            <span>{scan.files_scanned} files ({scan.lines_scanned.toLocaleString()} lines)</span>
            <span>•</span>
            <span>Audited {new Date(scan.started_at).toLocaleString()}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-10 px-4 gap-2 text-xs font-mono border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/30 text-black dark:text-white rounded-xl"
          >
            <Printer className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
            <span>Print PDF</span>
          </Button>

          <a href={`/api/scans/${scan.id}/cbom`} download target="_blank" rel="noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 gap-2 text-xs font-mono border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/30 text-black dark:text-white rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
              <span>Export CBOM</span>
            </Button>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 PRIMARY METRIC CARDS (Matching Home Page Pipeline Architecture) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60 font-mono shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[10px] font-mono text-black dark:text-white uppercase tracking-widest font-semibold">
            Core Cryptographic & Quantum Risk Vectors
          </div>
          <span className="text-[10px] font-mono text-yellow-500 dark:text-yellow-400 font-bold">
            Deterministic Engine v2.4
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs font-mono">
          {/* Card 01: Overall Risk */}
          <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors group">
            <div className="text-black dark:text-white text-[10px] uppercase font-semibold">VECTOR 01 // OVERALL RISK</div>
            <div className="font-bold text-3xl sm:text-4xl text-black dark:text-white mt-1 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">
              {scan.overall_risk_score !== null ? Number(scan.overall_risk_score).toFixed(1) : "—"}
            </div>
            <div className="text-[10px] text-yellow-500 dark:text-yellow-400 mt-1.5 font-bold flex items-center gap-1.5">
              <span>{scan.overall_risk_level || "MODERATE"} EXPOSURE</span>
            </div>
          </div>

          {/* Card 02: PQC Readiness */}
          <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors group">
            <div className="text-black dark:text-white text-[10px] uppercase font-semibold">VECTOR 02 // PQC READINESS</div>
            <div className="font-bold text-3xl sm:text-4xl text-black dark:text-white mt-1 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">
              {scan.pqc_readiness_score !== null ? `${Number(scan.pqc_readiness_score).toFixed(1)}%` : "0.0%"}
            </div>
            <div className="text-[10px] text-yellow-500 dark:text-yellow-400 mt-1.5 font-bold">
              {scan.pqc_readiness_level || "DEVELOPING"} POSTURE
            </div>
          </div>

          {/* Card 03: Crypto Assets */}
          <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors group">
            <div className="text-black dark:text-white text-[10px] uppercase font-semibold">VECTOR 03 // CBOM DISCOVERY</div>
            <div className="font-bold text-3xl sm:text-4xl text-black dark:text-white mt-1 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">
              {scan.total_findings.toLocaleString()}
            </div>
            <div className="text-[10px] text-yellow-500 dark:text-yellow-400 mt-1.5 font-bold">
              {distinctAlgos} Distinct Algorithms
            </div>
          </div>

          {/* Card 04: Quantum Vulnerable */}
          <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors group">
            <div className="text-black dark:text-white text-[10px] uppercase font-semibold">VECTOR 04 // QUANTUM VULN</div>
            <div className="font-bold text-3xl sm:text-4xl text-black dark:text-white mt-1 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">
              {scan.quantum_vulnerable_count.toLocaleString()}
            </div>
            <div className={`text-[10px] mt-1.5 font-bold ${scan.quantum_vulnerable_count > 0 ? "text-yellow-500 dark:text-yellow-400" : "text-black dark:text-white"}`}>
              {scan.quantum_vulnerable_count > 0 ? "Shor's Susceptible" : "0 Shor Susceptible (Safe)"}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTRAL POSTURE ASSESSMENT SHOWCASE CARD (Matching Home Page Workspace Card) */}
      {/* ========================================================================= */}
      <Card className="p-7 sm:p-9 border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent shadow-xl rounded-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-5 text-left font-mono w-full">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span>Automated Posture Assessment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight">
                Cryptographic Security Posture
              </h2>
              <p className="text-xs text-black dark:text-white mt-2 leading-relaxed max-w-2xl">
                The repository operates with an overall risk rating of <strong className="text-black dark:text-white font-bold">{Number(scan.overall_risk_score || 0).toFixed(1)}/100</strong> ({scan.overall_risk_level || "MODERATE"}). There are <strong className="text-yellow-500 dark:text-yellow-400 font-bold">{scan.quantum_vulnerable_count}</strong> cryptographic mechanisms susceptible to quantum cryptanalysis (Shor's algorithm).
              </p>
            </div>

            {/* 4 Quantitative Breakdown Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-[10px] text-black dark:text-white font-semibold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Shor Vuln</span>
                </div>
                <div className="text-2xl font-bold text-black dark:text-white mt-1">{scan.quantum_vulnerable_count}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-[10px] text-black dark:text-white font-semibold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                  <span>Grover Weak</span>
                </div>
                <div className="text-2xl font-bold text-black dark:text-white mt-1">{scan.quantum_partial_count}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-[10px] text-black dark:text-white font-semibold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>PQC Ready</span>
                </div>
                <div className="text-2xl font-bold text-black dark:text-white mt-1">{scan.quantum_safe_count}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-[10px] text-black dark:text-white font-semibold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                  <span>Undetermined</span>
                </div>
                <div className="text-2xl font-bold text-black dark:text-white mt-1">
                  {Math.max(0, scan.total_findings - scan.quantum_vulnerable_count - scan.quantum_partial_count - scan.quantum_safe_count)}
                </div>
              </div>
            </div>

            {/* Quick Jump Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a href="#inventory">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-mono gap-1.5 border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/30 text-black dark:text-white rounded-xl"
                >
                  <Layers className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                  <span>Explore CBOM Inventory</span>
                  <ArrowRight className="w-3 h-3 text-black dark:text-white" />
                </Button>
              </a>
              <a href="#migration">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-mono gap-1.5 border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/30 text-black dark:text-white rounded-xl"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                  <span>Migration Roadmap</span>
                  <ArrowRight className="w-3 h-3 text-black dark:text-white" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right Gauge */}
          <div className="shrink-0 flex items-center justify-center">
            <RadialPostureMap
              overallRisk={scan.overall_risk_score || 0}
              overallRiskLevel={scan.overall_risk_level || "LOW"}
              pqcReadiness={scan.pqc_readiness_score || 0}
            />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. CHAPTER 01: EXECUTIVE SUMMARY */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60 font-mono space-y-3 shadow-xl">
        <h3 className="text-sm font-bold font-mono text-black dark:text-white uppercase tracking-wider">
          Executive Summary & Scope
        </h3>
        <p className="text-xs font-mono text-black dark:text-white leading-relaxed">
          This assessment evaluated <strong className="text-black dark:text-white font-bold">{scan.files_scanned} files</strong> and identified <strong className="text-black dark:text-white font-bold">{scan.total_findings} cryptographic assets</strong> across symmetric ciphers, asymmetric key generation, digital signature routines, and transport security configurations. Long-term confidential data requires phased migration to post-quantum standards (<span className="text-yellow-500 dark:text-yellow-400 font-bold">NIST FIPS 203 ML-KEM</span> and <span className="text-yellow-500 dark:text-yellow-400 font-bold">FIPS 204 ML-DSA</span>).
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 5. CHAPTER 02: CRYPTOGRAPHIC INVENTORY (CBOM) */}
      {/* ========================================================================= */}
      <section id="inventory" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
              Cryptographic Inventory (CBOM)
            </h2>
            <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
              {inventory.length} discovered assets • {distinctAlgos} distinct algorithms • {scan.quantum_vulnerable_count} quantum-vulnerable
            </p>
          </div>
          <div className="text-xs font-mono text-black dark:text-white font-medium">
            CycloneDX 1.6 Specification
          </div>
        </div>

        {/* Filter Controls matching Home Page Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-black dark:text-white absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by algorithm, category, or file path..."
              value={invSearch}
              onChange={(e) => {
                setInvSearch(e.target.value);
                setInvPage(1);
              }}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 text-xs font-mono text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono w-full sm:w-auto">
            {["ALL", "ALGORITHM", "CERTIFICATE", "KEY", "PROTOCOL"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setInvType(t);
                  setInvPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl border transition-all text-xs font-mono ${
                  invType === t
                    ? "bg-yellow-500 text-black border-yellow-500 font-bold shadow-none dark:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/70 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:border-zinc-400 dark:hover:border-zinc-700 font-medium"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table matching Home Page Table */}
        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent rounded-2xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800/60 text-black dark:text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4 font-semibold">Asset / Algorithm</th>
                  <th className="p-4 font-semibold">Classification</th>
                  <th className="p-4 font-semibold">File Location</th>
                  <th className="p-4 font-semibold">Quantum Posture</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/40">
                {paginatedInventory.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setInspectedAsset(asset)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-black dark:text-white max-w-[240px] truncate" title={asset.algorithm || ""}>
                      <div className="truncate font-mono text-xs">{asset.algorithm || "Undetermined"}</div>
                      {asset.category && (
                        <div className="text-[10px] text-yellow-500 dark:text-yellow-400 font-mono mt-0.5 font-medium">{asset.category}</div>
                      )}
                    </td>
                    <td className="p-4 text-black dark:text-white text-xs">
                      <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/30 text-[10px] font-mono text-black dark:text-white font-medium">
                        {asset.asset_type || "UNKNOWN"}
                      </Badge>
                    </td>
                    <td className="p-4 text-black dark:text-white max-w-[240px] truncate font-mono text-xs" title={asset.file_path || ""}>
                      <div className="truncate text-black dark:text-white">
                        {cleanFilePath(asset.file_path)}:{asset.line_start || 1}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs font-semibold">
                      {asset.quantum_status === "VULNERABLE" && (
                        <span className="text-yellow-500 dark:text-yellow-400 font-bold">Quantum Vuln</span>
                      )}
                      {asset.quantum_status === "PARTIAL" && (
                        <span className="text-yellow-500 dark:text-yellow-400 font-medium">Weakened</span>
                      )}
                      {asset.quantum_status === "SAFE" && (
                        <span className="text-black dark:text-white font-medium">PQC Ready</span>
                      )}
                      {(!asset.quantum_status || asset.quantum_status === "UNKNOWN") && (
                        <span className="text-black dark:text-white font-medium">Undetermined</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedAsset(asset);
                        }}
                        className="h-7 text-[11px] gap-1 font-mono border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {paginatedInventory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-black dark:text-white text-xs font-mono">
                      No cryptographic assets match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-zinc-200/80 dark:border-zinc-800/60 text-xs font-mono text-black dark:text-white font-medium">
            <div>
              Page {invPage} of {totalInvPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={invPage <= 1}
                onClick={() => setInvPage(invPage - 1)}
                className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={invPage >= totalInvPages}
                onClick={() => setInvPage(invPage + 1)}
                className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 6. CHAPTER 03: VULNERABILITIES & FINDINGS */}
      {/* ========================================================================= */}
      <section id="findings" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
              Vulnerabilities & Findings
            </h2>
            <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
              {findings.length} findings identified across source code AST syntax patterns
            </p>
          </div>
          <div className="text-xs font-mono text-black dark:text-white font-medium">
            Static AST Analysis
          </div>
        </div>

        {/* Severity Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-black dark:text-white absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search findings by algorithm, location, or pattern..."
              value={findSearch}
              onChange={(e) => {
                setFindSearch(e.target.value);
                setFindPage(1);
              }}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 text-xs font-mono text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono w-full sm:w-auto">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setFindSeverity(sev);
                  setFindPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl border transition-all text-xs font-mono ${
                  findSeverity === sev
                    ? "bg-yellow-500 text-black border-yellow-500 font-bold shadow-none dark:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/70 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:border-zinc-400 dark:hover:border-zinc-700 font-medium"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/70 rounded-2xl bg-white dark:bg-transparent divide-y divide-zinc-200/60 dark:divide-zinc-800/40 overflow-hidden shadow-xl">
          {paginatedFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => setInspectedAsset(finding)}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors cursor-pointer text-xs font-mono"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`shrink-0 w-20 text-center font-bold font-mono text-xs uppercase ${
                    finding.severity === "CRITICAL" || finding.severity === "HIGH"
                      ? "text-yellow-500 dark:text-yellow-400"
                      : "text-black dark:text-white"
                  }`}
                >
                  {finding.severity || "INFO"}
                </span>

                <div className="truncate">
                  <div className="font-semibold text-black dark:text-white font-mono text-xs truncate">
                    {finding.algorithm || finding.finding_type}
                  </div>
                  <div className="text-[11px] text-black dark:text-white truncate font-mono mt-0.5">
                    {cleanFilePath(finding.file_path)}:{finding.line_start || 1}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0 justify-between sm:justify-end">
                <div className="text-black dark:text-white text-xs font-semibold">
                  {finding.quantum_status === "VULNERABLE" ? (
                    <span className="text-yellow-500 dark:text-yellow-400 font-bold">Quantum Vuln</span>
                  ) : (
                    <span>Risk {finding.risk_score ? Number(finding.risk_score).toFixed(0) : "20"}</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedAsset(finding);
                  }}
                  className="h-7 text-[11px] gap-1 font-mono border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {paginatedFindings.length === 0 && (
            <div className="p-12 text-center text-black dark:text-white text-xs font-mono">
              No findings match the selected criteria.
            </div>
          )}
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between p-2 text-xs font-mono text-black dark:text-white font-medium">
          <div>
            Page {findPage} of {totalFindPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={findPage <= 1}
              onClick={() => setFindPage(findPage - 1)}
              className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={findPage >= totalFindPages}
              onClick={() => setFindPage(findPage + 1)}
              className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CHAPTER 04: RISK & SECURITY SCORES (10 Evaluated Dimensions) */}
      {/* ========================================================================= */}
      <section id="risk" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
              Risk & Security Scores
            </h2>
            <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
              Deterministic evaluation across 10 security and compliance dimensions
            </p>
          </div>
        </div>

        {/* 10 Category Score Grid matching Pipeline Stage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {Object.entries(scores).map(([category, score]) => (
            <div
              key={category}
              className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 space-y-2 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors font-mono"
            >
              <div className="text-[10px] uppercase tracking-wider text-black dark:text-white font-semibold truncate flex items-center justify-between">
                <span>{category}</span>
                <span className="text-yellow-500 dark:text-yellow-400 text-[10px] font-bold">{score >= 80 ? "SECURE" : score >= 50 ? "REVIEW" : "ALERT"}</span>
              </div>
              <div className="text-2xl font-bold text-black dark:text-white font-mono">
                {score}/100
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden border-0">
                <div
                  style={{ width: `${score}%` }}
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CHAPTER 05: POST-QUANTUM READINESS & MOSCA */}
      {/* ========================================================================= */}
      <section id="quantum" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
              Post-Quantum Readiness & Mosca
            </h2>
            <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
              Evaluating Shor's algorithm threat, Grover's margin, and Mosca temporal inequality
            </p>
          </div>
        </div>

        {/* QRAMM Score Card */}
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-black dark:text-white font-semibold">
                QRAMM Readiness Score
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-yellow-500 dark:text-yellow-400 mt-1">
                {scan.pqc_readiness_score !== null ? Number(scan.pqc_readiness_score).toFixed(1) : "0.0"}%
              </div>
              <div className="text-xs text-black dark:text-white uppercase mt-0.5 font-semibold">
                STATUS: {scan.pqc_readiness_level || "DEVELOPING"}
              </div>
            </div>

            <p className="text-xs text-black dark:text-white max-w-sm leading-relaxed sm:text-right">
              Based on NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) standards and classical primitive elimination.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/60 font-mono">
            <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20">
              <div className="text-[10px] text-black dark:text-white font-semibold uppercase">Shor Vulnerable</div>
              <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400 mt-0.5">
                {scan.quantum_vulnerable_count}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20">
              <div className="text-[10px] text-black dark:text-white font-semibold uppercase">Grover Weakened</div>
              <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400 mt-0.5">
                {scan.quantum_partial_count}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20">
              <div className="text-[10px] text-black dark:text-white font-semibold uppercase">PQC Ready</div>
              <div className="text-2xl font-bold text-black dark:text-white mt-0.5">
                {scan.quantum_safe_count}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20">
              <div className="text-[10px] text-black dark:text-white font-semibold uppercase">Undetermined</div>
              <div className="text-2xl font-bold text-black dark:text-white mt-0.5">
                {Math.max(0, scan.total_findings - scan.quantum_vulnerable_count - scan.quantum_partial_count - scan.quantum_safe_count)}
              </div>
            </div>
          </div>
        </div>

        {/* Mosca Assessment Surface */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-950/20 space-y-3 font-mono shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
              Mosca's Inequality Assessment (X + Y &gt; Z)
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-yellow-500 dark:text-yellow-400 border-amber-300 dark:border-yellow-500/40 bg-amber-50 dark:bg-transparent font-semibold">HNDL THREAT MODEL</Badge>
          </div>
          <p className="text-xs text-black dark:text-white leading-relaxed">
            If data must remain secret for <strong className="text-black dark:text-white font-bold">X years</strong> and migration takes <strong className="text-black dark:text-white font-bold">Y years</strong>, and <strong className="text-black dark:text-white font-bold">X + Y &gt; Z (CRQC Arrival)</strong>, then encrypted communications are exposed today to <em className="text-yellow-500 dark:text-yellow-400 font-semibold not-italic">Harvest Now, Decrypt Later (HNDL)</em> adversaries.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CHAPTER 06: MIGRATION ROADMAP */}
      {/* ========================================================================= */}
      <section id="migration" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
              Migration Roadmap
            </h2>
            <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
              {recommendations.length} prioritized algorithm transitions to achieve Post-Quantum Compliance
            </p>
          </div>
        </div>

        {/* Migration Rows */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/70 rounded-2xl bg-white dark:bg-transparent divide-y divide-zinc-200/60 dark:divide-zinc-800/40 overflow-hidden text-xs font-mono shadow-xl">
          {recommendations.map((rec, i) => (
            <div
              key={rec.id || i}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors"
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
                    className="shrink-0 font-bold"
                  >
                    {rec.priority || "P1"}
                  </Badge>
                  <span className="font-semibold text-black dark:text-white truncate">{rec.title}</span>
                </div>
                <div className="text-black dark:text-white flex items-center gap-2 pt-0.5">
                  <span className="text-black dark:text-white font-mono font-medium">{rec.current_algorithm || "Classical"}</span>
                  <span className="text-yellow-500 dark:text-yellow-400 font-bold">→</span>
                  <span className="text-yellow-500 dark:text-yellow-400 font-bold font-mono">{rec.recommended_algorithm || "ML-KEM-768"}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:text-right">
                <div className="text-black dark:text-white text-xs font-medium">
                  {rec.finding_count || 1} occurrences
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {rec.status || "OPEN"}
                </Badge>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="p-12 text-center text-black dark:text-white text-xs font-mono">
              No active migration roadmap items.
            </div>
          )}
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 10. CHAPTER 07: TECHNICAL AUDIT REPORT */}
      {/* ========================================================================= */}
      {report?.sections && (
        <section id="report" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold font-mono text-black dark:text-white tracking-tight uppercase">
                Technical Audit Report
              </h2>
              <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1 font-semibold">
                Official 18-Section Cryptographic Security Audit Document
              </p>
            </div>
          </div>

          <Card className="p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent space-y-8 shadow-xl">
            {report.sections.map((sec: any) => (
              <article
                key={sec.id}
                className="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800/60 last:border-b-0"
              >
                <div className="flex items-baseline justify-between font-mono">
                  <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
                    {sec.title}
                  </h3>
                  <span className="text-[10px] text-yellow-500 dark:text-yellow-400 font-bold">
                    SECTION {String(sec.id).padStart(2, "0")} / 18
                  </span>
                </div>
                <div className="text-xs font-mono text-black dark:text-white leading-relaxed whitespace-pre-line">
                  {sec.content}
                </div>
              </article>
            ))}
          </Card>
        </section>
      )}

      {/* Slide-out Inspection Drawer */}
      <DetailDrawer
        isOpen={!!inspectedAsset}
        onClose={() => setInspectedAsset(null)}
        title={inspectedAsset?.algorithm || "Asset Inspection"}
        subtitle={`${cleanFilePath(inspectedAsset?.file_path)}:${inspectedAsset?.line_start || 1}`}
      >
        {inspectedAsset && (
          <div className="space-y-6 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20">
              <div>
                <span className="text-black dark:text-white uppercase text-[10px]">Type</span>
                <div className="font-semibold text-black dark:text-white mt-0.5">{inspectedAsset.asset_type}</div>
              </div>
              <div>
                <span className="text-black dark:text-white uppercase text-[10px]">Quantum Posture</span>
                <div className="font-semibold text-black dark:text-white mt-0.5">{inspectedAsset.quantum_status || "Undetermined"}</div>
              </div>
              <div>
                <span className="text-black dark:text-white uppercase text-[10px]">Key Parameter</span>
                <div className="font-semibold text-yellow-500 dark:text-yellow-400 mt-0.5 font-mono">{inspectedAsset.key_size ? `${inspectedAsset.key_size}-bit` : "Not Specified"}</div>
              </div>
              <div>
                <span className="text-black dark:text-white uppercase text-[10px]">Severity</span>
                <div className="font-semibold text-black dark:text-white mt-0.5">{inspectedAsset.severity || "INFO"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-yellow-500 dark:text-yellow-400 font-semibold font-mono">
                Code Evidence
              </div>
              <CodeEvidence
                filePath={cleanFilePath(inspectedAsset.file_path)}
                lineNumber={inspectedAsset.line_start}
                matchText={inspectedAsset.match_text}
                contextText={inspectedAsset.context}
                sourceContextJson={inspectedAsset.source_context_json}
              />
            </div>

            {inspectedAsset.remediation && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 space-y-1 font-mono">
                <div className="text-[10px] uppercase tracking-wider text-yellow-500 dark:text-yellow-400 font-semibold">
                  Migration Guidance
                </div>
                <p className="text-black dark:text-white leading-relaxed">
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
