"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScan, fetchScanInventory, ScanRecord, CryptoAssetRecord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function QuantumReadinessPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [assets, setAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchScan(id as string),
        fetchScanInventory(id as string),
      ])
        .then(([s, a]) => {
          setScan(s);
          setAssets(a);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Quantum Telemetry...
        </div>
      </div>
    );
  }

  const pqcScore = scan?.pqc_readiness_score !== null && scan?.pqc_readiness_score !== undefined
    ? Number(scan.pqc_readiness_score).toFixed(1)
    : "0.0";

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 select-none font-mono">
      {/* 1. Header */}
      <div className="border-b border-zinc-800 pb-6">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Post-Quantum Assessment
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          POST-QUANTUM READINESS
        </h1>
      </div>

      {/* 2. Large Readiness Score & 4-Item Breakdown Surface */}
      <div className="p-8 rounded-2xl border border-zinc-800/80 bg-[#121214] space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              QRAMM Readiness Level
            </div>
            <div className="text-5xl sm:text-6xl font-bold text-white mt-1">
              {pqcScore}%
            </div>
            <div className="text-xs text-zinc-400 mt-1 uppercase">
              STATUS: {scan?.pqc_readiness_level || "EARLY_STAGE"}
            </div>
          </div>

          <div className="text-xs text-zinc-400 max-w-xs leading-relaxed sm:text-right">
            Evaluates classical cryptographic reliance versus NIST post-quantum standards.
          </div>
        </div>

        {/* 4 Quantitative Buckets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/80">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#09090b]">
            <div className="text-[10px] text-zinc-500 uppercase">Vulnerable (Shor)</div>
            <div className="text-2xl font-bold text-white mt-1">
              {scan?.quantum_vulnerable_count || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#09090b]">
            <div className="text-[10px] text-zinc-500 uppercase">Weakened (Grover)</div>
            <div className="text-2xl font-bold text-white mt-1">
              {scan?.quantum_partial_count || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#09090b]">
            <div className="text-[10px] text-zinc-500 uppercase">Post-Quantum Safe</div>
            <div className="text-2xl font-bold text-white mt-1">
              {scan?.quantum_safe_count || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#09090b]">
            <div className="text-[10px] text-zinc-500 uppercase">Undetermined</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.max(0, (scan?.total_findings || 0) - (scan?.quantum_vulnerable_count || 0) - (scan?.quantum_partial_count || 0) - (scan?.quantum_safe_count || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. One Clean Migration Timeline */}
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Strategic Migration Timeline
        </div>

        <div className="border border-zinc-800/80 rounded-2xl bg-[#121214] divide-y divide-zinc-800/60 overflow-hidden text-xs">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-semibold">PHASE 1 • IMMEDIATE</div>
              <div className="font-semibold text-white mt-0.5">Deprecate Insecure Primitives</div>
              <p className="text-[11px] text-zinc-400 mt-1">Eliminate RSA &lt; 2048, MD5, and SHA-1 legacy uses.</p>
            </div>
            <Badge variant="solid" className="shrink-0 w-fit">P0</Badge>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-semibold">PHASE 2 • 12 MONTHS</div>
              <div className="font-semibold text-white mt-0.5">Deploy Hybrid Key Encapsulation (KEM)</div>
              <p className="text-[11px] text-zinc-400 mt-1">Transition TLS and key exchanges to X25519 + ML-KEM-768.</p>
            </div>
            <Badge variant="outline" className="shrink-0 w-fit">P1</Badge>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-semibold">PHASE 3 • 3 YEARS</div>
              <div className="font-semibold text-white mt-0.5">Post-Quantum Digital Signatures</div>
              <p className="text-[11px] text-zinc-400 mt-1">Adopt NIST FIPS 204 ML-DSA for code signing and PKI.</p>
            </div>
            <Badge variant="outline" className="shrink-0 w-fit">P2</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
