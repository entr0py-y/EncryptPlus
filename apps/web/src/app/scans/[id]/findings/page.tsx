"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScanFindings, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileCode,
  AlertTriangle,
  Lock
} from "lucide-react";

export default function FindingsPage() {
  const { id } = useParams();
  const [findings, setFindings] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedQuantum, setSelectedQuantum] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (id) {
      fetchScanFindings(id as string)
        .then((data) => {
          setFindings(Array.isArray(data) ? data : []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        (f.algorithm && f.algorithm.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.file_path && f.file_path.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.match_text && f.match_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.finding_type && f.finding_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeverity =
        selectedSeverity === "ALL" || (f.severity || "").toUpperCase() === selectedSeverity.toUpperCase();

      const matchesQuantum =
        selectedQuantum === "ALL" || (f.quantum_status || "").toUpperCase() === selectedQuantum.toUpperCase();

      return matchesSearch && matchesSeverity && matchesQuantum;
    });
  }, [findings, searchQuery, selectedSeverity, selectedQuantum]);

  const paginatedFindings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, page]);

  const totalPages = Math.ceil(filteredFindings.length / pageSize) || 1;

  // Compute severity distribution
  const critCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const medCount = findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = findings.filter((f) => f.severity === "LOW").length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Security Intelligence & Investigation
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Vulnerabilities & Findings
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Prioritized cryptographic misconfigurations, quantum vulnerabilities, and broken primitives.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          Showing <strong className="text-white">{filteredFindings.length}</strong> of <strong className="text-white">{findings.length}</strong> findings
        </div>
      </div>

      {/* Severity Filter Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
        <button
          onClick={() => {
            setSelectedSeverity("ALL");
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedSeverity === "ALL"
              ? "bg-zinc-100 text-zinc-950 border-white font-bold"
              : "bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          <div className="text-[10px] text-zinc-500 uppercase">All Severity</div>
          <div className="text-2xl font-bold font-mono mt-1">{findings.length}</div>
        </button>

        <button
          onClick={() => {
            setSelectedSeverity("CRITICAL");
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedSeverity === "CRITICAL"
              ? "bg-white text-zinc-950 border-white font-bold"
              : "bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
          }`}
        >
          <div className="text-[10px] text-zinc-500 uppercase">Critical</div>
          <div className="text-2xl font-bold font-mono mt-1">{critCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedSeverity("HIGH");
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedSeverity === "HIGH"
              ? "bg-zinc-200 text-zinc-950 border-zinc-300 font-bold"
              : "bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <div className="text-[10px] text-zinc-500 uppercase">High Priority</div>
          <div className="text-2xl font-bold font-mono mt-1">{highCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedSeverity("MEDIUM");
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedSeverity === "MEDIUM"
              ? "bg-zinc-800 text-white border-zinc-600 font-bold"
              : "bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <div className="text-[10px] text-zinc-500 uppercase">Medium Risk</div>
          <div className="text-2xl font-bold font-mono mt-1">{medCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedSeverity("LOW");
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedSeverity === "LOW"
              ? "bg-zinc-800 text-white border-zinc-600 font-bold"
              : "bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <div className="text-[10px] text-zinc-500 uppercase">Low / Hardening</div>
          <div className="text-2xl font-bold font-mono mt-1">{lowCount}</div>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-4 bg-[#121215] p-3 rounded-2xl border border-zinc-800">
        <Search className="w-4 h-4 text-zinc-500 ml-2" />
        <input
          type="text"
          placeholder="Filter by vulnerability description, file location, algorithm, or code match..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full h-9 bg-transparent text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none"
        />
      </div>

      {/* Findings List (Investigation Cards) */}
      <div className="space-y-3">
        {paginatedFindings.map((finding) => (
          <div
            key={finding.id}
            className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
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
                >
                  {finding.severity || "INFO"}
                </Badge>

                {finding.quantum_status === "VULNERABLE" && (
                  <Badge variant="vulnerable">Quantum Vulnerable</Badge>
                )}

                <span className="text-sm font-bold text-white font-mono tracking-tight truncate">
                  {finding.algorithm || finding.finding_type || "Undetermined Crypto Finding"}
                </span>
              </div>

              <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-300 font-medium truncate">{finding.file_path}</span>
                <span className="text-zinc-600 font-bold shrink-0">:{finding.line_start || 1}</span>
              </div>

              {finding.match_text && (
                <div className="font-mono text-xs text-zinc-300 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 truncate max-w-3xl">
                  <span className="text-zinc-600 mr-2">$</span>
                  <span className="text-white font-semibold">{finding.match_text}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-3 md:pt-0 md:pl-6">
              <div className="text-right font-mono hidden md:block">
                <div className="text-xs font-bold text-white">
                  Risk {finding.risk_score ? Number(finding.risk_score).toFixed(0) : "25"}/100
                </div>
                <div className="text-[10px] text-zinc-500">
                  {finding.confidence || "HIGH"} Confidence
                </div>
              </div>

              <Link href={`/scans/${id}/findings/${finding.id}`}>
                <Button variant="default" size="sm" className="font-mono text-xs gap-1.5 h-9">
                  <span>View Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {paginatedFindings.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
            No vulnerabilities or findings match the current filter selection.
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-2xl bg-zinc-950 text-xs font-mono text-zinc-400">
        <div>
          Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
