"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Shield,
  Zap,
  Key,
  Award,
  Network,
  Cpu,
  Lock,
  ArrowUpDown
} from "lucide-react";

export default function InventoryPage() {
  const { id } = useParams();
  const [assets, setAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedQuantum, setSelectedQuantum] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

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
        (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.match_text && a.match_text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "ALL" || (a.asset_type || "").toUpperCase() === selectedType.toUpperCase();

      const matchesQuantum =
        selectedQuantum === "ALL" || (a.quantum_status || "").toUpperCase() === selectedQuantum.toUpperCase();

      const matchesSeverity =
        selectedSeverity === "ALL" || (a.severity || "").toUpperCase() === selectedSeverity.toUpperCase();

      return matchesSearch && matchesType && matchesQuantum && matchesSeverity;
    });
  }, [assets, searchQuery, selectedType, selectedQuantum, selectedSeverity]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page]);

  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Bill of Materials (CBOM)
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Cryptographic Inventory
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Catalogue of all discovered cryptographic algorithms, certificates, keys, protocols, and dependencies.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          Showing <strong className="text-white">{filteredAssets.length}</strong> of <strong className="text-white">{assets.length}</strong> total assets
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#121215] p-4 rounded-2xl border border-zinc-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by algorithm, file, category, or code token..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          {["ALL", "ALGORITHM", "CERTIFICATE", "KEY", "PROTOCOL", "LIBRARY"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedType(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                selectedType === t
                  ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Quantum Status Filter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {["ALL", "VULNERABLE", "PARTIAL", "SAFE"].map((q) => (
            <button
              key={q}
              onClick={() => {
                setSelectedQuantum(q);
                setPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition-all text-xs ${
                selectedQuantum === q
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Asset / Mechanism</th>
                <th className="p-4">Type</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Key / Bits</th>
                <th className="p-4">Quantum Risk</th>
                <th className="p-4">Severity</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setInspectedAsset(asset)}
                  className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-semibold text-white max-w-[260px] truncate" title={asset.algorithm || "Undetermined"}>
                    <div className="truncate group-hover:text-zinc-100 transition-colors">
                      {asset.algorithm || "Algorithm could not be determined from available evidence"}
                    </div>
                    {asset.primitive && (
                      <div className="text-[10px] text-zinc-500 font-normal">Primitive: {asset.primitive}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px]">
                      {asset.asset_type || "UNKNOWN"}
                    </Badge>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-[140px] text-[11px]">
                    {asset.category || "General"}
                  </td>
                  <td className="p-4 text-zinc-400 max-w-[240px] truncate" title={asset.file_path || ""}>
                    <div className="truncate text-zinc-300 font-mono">
                      {asset.file_path ? asset.file_path.split("/").pop() : "—"}
                    </div>
                    <div className="text-[10px] text-zinc-600">Line: {asset.line_start || 1}</div>
                  </td>
                  <td className="p-4 text-zinc-300 font-mono">
                    {asset.key_size ? `${asset.key_size}-bit` : "—"}
                  </td>
                  <td className="p-4">
                    {asset.quantum_status === "VULNERABLE" && (
                      <Badge variant="vulnerable">Quantum Vuln</Badge>
                    )}
                    {asset.quantum_status === "PARTIAL" && (
                      <Badge variant="partial">Weakened</Badge>
                    )}
                    {asset.quantum_status === "SAFE" && (
                      <Badge variant="safe">PQC Safe</Badge>
                    )}
                    {(!asset.quantum_status || asset.quantum_status === "UNKNOWN") && (
                      <Badge variant="muted">Undetermined</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        asset.severity === "CRITICAL"
                          ? "critical"
                          : asset.severity === "HIGH"
                          ? "high"
                          : asset.severity === "MEDIUM"
                          ? "medium"
                          : "low"
                      }
                    >
                      {asset.severity || "INFO"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedAsset(asset);
                      }}
                      className="h-7 text-[11px] font-mono"
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}

              {paginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500 font-mono text-xs">
                    No cryptographic assets matching the specified filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/40 text-xs font-mono text-zinc-400">
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
      </Card>

      {/* Slide-out Inspection Drawer */}
      <DetailDrawer
        isOpen={!!inspectedAsset}
        onClose={() => setInspectedAsset(null)}
        title={inspectedAsset?.algorithm || "Cryptographic Asset Detail"}
        subtitle={`${inspectedAsset?.file_path || "Unknown location"}:${inspectedAsset?.line_start || 1}`}
      >
        {inspectedAsset && (
          <div className="space-y-6 text-xs font-mono">
            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Asset Classification:</span>
                <div className="font-semibold text-zinc-200 mt-0.5">{inspectedAsset.asset_type || "UNKNOWN"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Category:</span>
                <div className="font-semibold text-zinc-200 mt-0.5">{inspectedAsset.category || "General"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Quantum Risk:</span>
                <div className="font-semibold text-white mt-0.5">{inspectedAsset.quantum_status || "Undetermined"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Severity Level:</span>
                <div className="font-semibold text-zinc-200 mt-0.5">{inspectedAsset.severity || "INFO"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Key Parameter / Size:</span>
                <div className="font-semibold text-zinc-200 mt-0.5">{inspectedAsset.key_size ? `${inspectedAsset.key_size}-bit` : "Not Specified"}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Confidence:</span>
                <div className="font-semibold text-zinc-200 mt-0.5">{inspectedAsset.confidence || "MEDIUM"}</div>
              </div>
            </div>

            {/* Code Evidence */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                Code Evidence & AST Token Match
              </div>
              <CodeEvidence
                filePath={inspectedAsset.file_path}
                lineNumber={inspectedAsset.line_start}
                column={inspectedAsset.column}
                matchText={inspectedAsset.match_text}
                contextText={inspectedAsset.context}
                sourceContextJson={inspectedAsset.source_context_json}
              />
            </div>

            {/* Why It Matters / Description */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Cryptographic Security Impact
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {inspectedAsset.description || "Discovered cryptographic mechanism identified through AST pattern detection."}
              </p>
            </div>

            {/* Remediation & Recommendation */}
            {inspectedAsset.remediation && (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Remediation & Migration Guidance
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
