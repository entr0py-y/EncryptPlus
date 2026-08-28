"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScanFindings, CryptoAssetRecord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileCode } from "lucide-react";

export default function FindingsPage() {
  const { id } = useParams();
  const [findings, setFindings] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
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
        (f.finding_type && f.finding_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeverity =
        selectedSeverity === "ALL" || (f.severity || "").toUpperCase() === selectedSeverity.toUpperCase();

      return matchesSearch && matchesSeverity;
    });
  }, [findings, searchQuery, selectedSeverity]);

  const paginatedFindings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, page]);

  const totalPages = Math.ceil(filteredFindings.length / pageSize) || 1;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Security & Vulnerabilities
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-1">
            FINDINGS
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Showing {filteredFindings.length} of {findings.length} total findings
          </p>
        </div>
      </div>

      {/* 2. Small Filter Row & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search findings by algorithm, file, or pattern..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-800 bg-[#121214] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono w-full sm:w-auto">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => {
                setSelectedSeverity(sev);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                selectedSeverity === sev
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-[#121214] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Findings List (Simple Horizontal Rows) */}
      <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] divide-y divide-zinc-800/60 overflow-hidden">
        {paginatedFindings.map((finding) => (
          <div
            key={finding.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors text-xs font-mono"
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
                <div className="font-semibold text-white truncate">
                  {finding.algorithm || finding.finding_type}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {finding.file_path}:{finding.line_start || 1}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
              <div className="text-zinc-400 text-[11px]">
                {finding.quantum_status === "VULNERABLE" ? (
                  <span className="text-zinc-300 font-semibold">Quantum Vuln</span>
                ) : (
                  <span>Risk {finding.risk_score ? Number(finding.risk_score).toFixed(0) : "25"}</span>
                )}
              </div>

              <Link href={`/scans/${id}/findings/${finding.id}`}>
                <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-mono">
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {paginatedFindings.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">
            No findings match the selected criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-2 text-xs font-mono text-zinc-500">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 text-xs font-mono"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 text-xs font-mono"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
