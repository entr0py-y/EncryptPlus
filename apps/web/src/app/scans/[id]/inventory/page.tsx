"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileCode } from "lucide-react";

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
    <div className="p-10 max-w-5xl mx-auto space-y-8 select-none">
      {/* 1. Header with Minimal Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Bill of Materials
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-1">
            CRYPTOGRAPHIC INVENTORY
          </h1>
          <div className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-2">
            <span><strong>{assets.length}</strong> Total Assets</span>
            <span>•</span>
            <span><strong>{distinctAlgos}</strong> Algorithms</span>
            <span>•</span>
            <span><strong>{quantumVulnCount}</strong> Quantum Vulnerable</span>
          </div>
        </div>
      </div>

      {/* 2. Clean Search & Type Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter assets by algorithm, category, or file path..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-800 bg-[#121214] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
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
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                selectedType === t
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-[#121214] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ONE Clean Table */}
      <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Asset / Mechanism</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Quantum Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setInspectedAsset(asset)}
                  className="hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-medium text-white max-w-[240px] truncate" title={asset.algorithm || ""}>
                    <div className="truncate">{asset.algorithm || "Undetermined"}</div>
                    {asset.category && (
                      <div className="text-[10px] text-zinc-500 font-normal">{asset.category}</div>
                    )}
                  </td>
                  <td className="p-4 text-zinc-400">
                    <span className="text-[11px]">{asset.asset_type || "UNKNOWN"}</span>
                  </td>
                  <td className="p-4 text-zinc-400 max-w-[220px] truncate" title={asset.file_path || ""}>
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
                      className="text-zinc-400 hover:text-white font-mono text-[11px] underline-offset-4 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500 font-mono text-xs">
                    No cryptographic assets match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 text-xs font-mono text-zinc-500">
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

      {/* Slide-out Inspection Drawer */}
      <DetailDrawer
        isOpen={!!inspectedAsset}
        onClose={() => setInspectedAsset(null)}
        title={inspectedAsset?.algorithm || "Asset Inspection"}
        subtitle={`${inspectedAsset?.file_path || ""}:${inspectedAsset?.line_start || 1}`}
      >
        {inspectedAsset && (
          <div className="space-y-6 text-xs font-mono">
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
                <div className="font-semibold text-white mt-0.5">{inspectedAsset.key_size ? `${inspectedAsset.key_size}-bit` : "Not Specified"}</div>
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
