"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileCode, ArrowRight } from "lucide-react";

function cleanFilePath(path?: string | null): string {
  if (!path) return "—";
  return path.replace(/^.*\/ecdat_work_[^/]+\//, "").replace(/^\/tmp\/[^/]+\//, "");
}

export default function InventoryPage() {
  const { id } = useParams();
  const [assets, setAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected Asset for Drawer
  const [inspectedAsset, setInspectedAsset] = useState<CryptoAssetRecord | null>(null);

  useEffect(() => {
    if (id) {
      fetchScanInventory(id as string)
        .then(setAssets)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        searchQuery === "" ||
        (a.algorithm && a.algorithm.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.file_path && a.file_path.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "ALL" || (a.asset_type || "").toUpperCase() === selectedType.toUpperCase();

      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, selectedType]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page]);

  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;

  // Summary counts
  const distinctAlgos = new Set(assets.map((a) => a.algorithm).filter(Boolean)).size;
  const quantumVulnCount = assets.filter((a) => a.quantum_status === "VULNERABLE").length;

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6 select-none font-sans">
      {/* 1. Header with Minimal Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <Link
            href={`/scans/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors mb-2 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Scan #{id} Assessment</span>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold">
            Cryptographic Bill of Materials (CBOM)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white font-mono mt-1">
            CRYPTOGRAPHIC INVENTORY
          </h1>
          <div className="text-xs font-mono text-black dark:text-white mt-1 flex items-center gap-2">
            <span><strong className="text-black dark:text-white font-bold">{assets.length}</strong> Total Assets</span>
            <span>•</span>
            <span><strong className="text-yellow-500 dark:text-yellow-400 font-bold">{distinctAlgos}</strong> Algorithms</span>
            <span>•</span>
            <span><strong className="text-yellow-500 dark:text-yellow-400 font-bold">{quantumVulnCount}</strong> Quantum Vulnerable</span>
          </div>
        </div>
      </div>

      {/* 2. Clean Search & Type Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-black dark:text-white absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter assets by algorithm, category, or file path..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 text-xs font-mono text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono w-full sm:w-auto">
          {["ALL", "ALGORITHM", "CERTIFICATE", "KEY", "PROTOCOL"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedType(t);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl border transition-all text-xs font-mono ${
                selectedType === t
                  ? "bg-yellow-500 text-black border-yellow-500 font-bold shadow-none dark:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  : "bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/70 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:border-zinc-400 dark:hover:border-zinc-700 font-medium"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ONE Clean Table */}
      <div className="border border-zinc-200/80 dark:border-zinc-800/70 rounded-2xl bg-white dark:bg-transparent overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800/60 text-black dark:text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-4 font-semibold">Asset / Mechanism</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Quantum Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/40">
              {paginatedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setInspectedAsset(asset)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-semibold text-black dark:text-white max-w-[240px] truncate" title={asset.algorithm || ""}>
                    <div className="truncate font-mono">{asset.algorithm || "Undetermined"}</div>
                    {asset.category && (
                      <div className="text-[10px] text-yellow-500 dark:text-yellow-400 font-mono mt-0.5 font-medium">{asset.category}</div>
                    )}
                  </td>
                  <td className="p-4 text-black dark:text-white">
                    <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/30 text-[10px] font-mono text-black dark:text-white font-medium">
                      {asset.asset_type || "UNKNOWN"}
                    </Badge>
                  </td>
                  <td className="p-4 text-black dark:text-white max-w-[220px] truncate font-mono text-xs" title={asset.file_path || ""}>
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

              {paginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-black dark:text-white font-mono text-xs">
                    No cryptographic assets match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200/80 dark:border-zinc-800/60 text-xs font-mono text-black dark:text-white font-medium">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 text-xs font-mono border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-out Inspection Drawer */}
      <DetailDrawer
        isOpen={!!inspectedAsset}
        onClose={() => setInspectedAsset(null)}
        title={inspectedAsset?.algorithm || "Asset Inspection"}
        subtitle={`${inspectedAsset?.file_path || ""}:${inspectedAsset?.line_start || 1}`}
      >
        {inspectedAsset && (
          <div className="space-y-6 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
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
                <div className="font-semibold text-black dark:text-white mt-0.5">{inspectedAsset.key_size ? `${inspectedAsset.key_size}-bit` : "Not Specified"}</div>
              </div>
              <div>
                <span className="text-black dark:text-white uppercase text-[10px]">Severity</span>
                <div className="font-semibold text-black dark:text-white mt-0.5">{inspectedAsset.severity || "INFO"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-yellow-500 dark:text-yellow-400 font-semibold">
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
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 space-y-1">
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
