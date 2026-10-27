"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAlgorithms, fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, Shield, Search } from "lucide-react";

export default function AlgorithmsPage() {
  const { id } = useParams();
  const [algorithms, setAlgorithms] = useState<Record<string, number>>({});
  const [assets, setAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchAlgorithms(id as string).catch(() => ({})),
        fetchScanInventory(id as string).catch(() => []),
      ])
        .then(([algos, allAssets]) => {
          setAlgorithms(algos);
          setAssets(allAssets);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const algoEntries = Object.entries(algorithms)
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold">
            Cryptographic Primitives & Health
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono mt-1">
            Algorithms Explorer
          </h1>
          <p className="text-xs font-mono text-black dark:text-white mt-1 font-medium">
            Breakdown of cryptographic algorithms, signature schemes, key encapsulation, and symmetric primitives.
          </p>
        </div>
        <div className="text-xs font-mono text-black dark:text-white">
          <strong className="text-black dark:text-white font-bold">{algoEntries.length}</strong> Distinct Mechanisms Catalogued
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-[#121215] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <Search className="w-4 h-4 text-black dark:text-white ml-2" />
        <input
          type="text"
          placeholder="Filter algorithms by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 bg-transparent text-xs font-mono text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {algoEntries.map(([algoName, count]) => {
          const matchingAssets = assets.filter((a) => a.algorithm === algoName);
          const sample = matchingAssets[0];
          const isVuln = sample?.quantum_status === "VULNERABLE";
          const isSafe = sample?.quantum_status === "SAFE";
          const isPartial = sample?.quantum_status === "PARTIAL";

          return (
            <Card key={algoName} className="p-5 space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                    <span className="font-bold text-black dark:text-white text-sm font-mono tracking-tight">{algoName}</span>
                  </div>
                  <div className="text-[10px] text-black dark:text-white font-mono">
                    Primitive: {sample?.primitive || "Standard"}
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-black dark:text-white">{count}</div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800/80 text-xs font-mono">
                <span className="text-black dark:text-white font-medium">Quantum Posture:</span>
                {isVuln && <span className="text-yellow-500 dark:text-yellow-400 font-bold">Quantum Vuln</span>}
                {isSafe && <span className="text-black dark:text-white font-medium">PQC Ready</span>}
                {isPartial && <span className="text-yellow-500 dark:text-yellow-400 font-medium">Weakened</span>}
                {!isVuln && !isSafe && !isPartial && <span className="text-black dark:text-white font-medium">Undetermined</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
