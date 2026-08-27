"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function DependenciesPage() {
  const { id } = useParams();
  const [depAssets, setDepAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchScanInventory(id as string)
        .then((data) => {
          const deps = data.filter(
            (a) =>
              (a.asset_type || "").toUpperCase() === "LIBRARY" ||
              (a.category || "").toLowerCase().includes("library") ||
              (a.category || "").toLowerCase().includes("import")
          );
          setDepAssets(deps);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Packages & Dependencies
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Library & Provider Dependencies
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Tracking JCA/JCE Security Providers, OpenSSL native bindings, and Python Cryptography packages.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          <strong className="text-white">{depAssets.length}</strong> Package Imports Detected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Java Cryptography SPI</div>
          <div className="text-3xl font-bold text-white font-mono">
            {depAssets.filter((d) => (d.algorithm || "").includes("Java")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">javax.crypto & java.security</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Native OpenSSL Bindings</div>
          <div className="text-3xl font-bold text-white font-mono">
            {depAssets.filter((d) => (d.algorithm || "").includes("OpenSSL")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">C/C++ Native Calls</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Python Cryptography</div>
          <div className="text-3xl font-bold text-white font-mono">
            {depAssets.filter((d) => (d.algorithm || "").includes("Python")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">hashlib / cryptography</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Cryptographic Provider / Library</th>
                <th className="p-4">Source File</th>
                <th className="p-4">Import Match</th>
                <th className="p-4">Quantum Migration Relevance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {depAssets.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{d.algorithm || d.finding_type || "Crypto Library Import"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-[240px]" title={d.file_path || ""}>
                    {d.file_path ? d.file_path.split("/").pop() : "—"}:{d.line_start || 1}
                  </td>
                  <td className="p-4 font-mono text-zinc-300">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {d.match_text || "import java.security.*"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px]">
                      PQC Provider Upgrade Required
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
