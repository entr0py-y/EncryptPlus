"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchScan, fetchScanInventory, ScanRecord, CryptoAssetRecord } from "@/lib/api";
import { QuantumHorizon } from "@/components/ui/quantum-horizon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ShieldAlert, Clock, ArrowRight, CheckCircle2, Cpu } from "lucide-react";

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

  const vulnAssets = assets.filter((a) => a.quantum_status === "VULNERABLE");
  const partialAssets = assets.filter((a) => a.quantum_status === "PARTIAL");

  const pqcScore = scan?.pqc_readiness_score !== null && scan?.pqc_readiness_score !== undefined
    ? Number(scan.pqc_readiness_score).toFixed(1)
    : "0.0";

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Quantum Threat Modeling & Migration Governance
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Post-Quantum Cryptography Readiness
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Evaluating Shor's algorithm impact on asymmetric primitives and Grover's algorithm on symmetric ciphers.
          </p>
        </div>
      </div>

      {/* Hero Score & Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 p-8 rounded-3xl border border-zinc-800 bg-[#121215] space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              QRAMM Migration Readiness Score
            </div>
            <div className="text-6xl font-bold font-mono text-white leading-none">
              {pqcScore}%
            </div>
            <div className="text-xs font-mono text-zinc-400 uppercase pt-1">
              STATUS: {scan?.pqc_readiness_level || "EARLY_STAGE"}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 leading-relaxed">
            Based on the Quantum Risk Assessment and Migration Model (QRAMM), weighted formula accounting for lattice standards (FIPS 203/204), symmetric margins, and Shor's exposure.
          </div>
        </div>

        <div className="lg:col-span-7 p-8 rounded-3xl border border-zinc-800 bg-[#121215]">
          <QuantumHorizon
            vulnerableCount={scan?.quantum_vulnerable_count || 0}
            partialCount={scan?.quantum_partial_count || 0}
            safeCount={scan?.quantum_safe_count || 0}
          />
        </div>
      </div>

      {/* 5-Stage Visual Migration Horizon */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
          Strategic Post-Quantum Migration Horizon
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-4 rounded-2xl border border-white bg-zinc-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white uppercase">STAGE 01</span>
              <Badge variant="solid" className="text-[10px]">NOW</Badge>
            </div>
            <div className="font-bold text-white text-sm">Deprecate Classical PKE</div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Eliminate RSA &lt; 2048 and deprecated hashes (MD5, SHA-1).
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-700 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase">STAGE 02</span>
              <span className="text-[10px] text-zinc-500 font-semibold">12 MONTHS</span>
            </div>
            <div className="font-bold text-zinc-200 text-sm">Hybrid KEM Deploy</div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Implement X25519 + ML-KEM-768 hybrid key encapsulation for TLS.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">STAGE 03</span>
              <span className="text-[10px] text-zinc-500 font-semibold">3 YEARS</span>
            </div>
            <div className="font-bold text-zinc-300 text-sm">Digital Signature Shift</div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Transition authentication and JWTs to ML-DSA-65 / SLH-DSA.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">STAGE 04</span>
              <span className="text-[10px] text-zinc-500 font-semibold">5 YEARS</span>
            </div>
            <div className="font-bold text-zinc-300 text-sm">PKI & Cert Chain Migration</div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Issue post-quantum X.509 root & intermediate certificates.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">STAGE 05</span>
              <span className="text-[10px] text-zinc-500 font-semibold">LONG-TERM</span>
            </div>
            <div className="font-bold text-zinc-300 text-sm">Full CNSA 2.0 State</div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Strict pure post-quantum algorithms without classical fallbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Immediate Vulnerable Assets Queue */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
          High-Priority Quantum-Vulnerable Assets ({vulnAssets.length})
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Vulnerable Primitive</th>
                  <th className="p-4">Threat Mechanism</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Target PQC Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {vulnAssets.slice(0, 15).map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>{a.algorithm || a.finding_type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300">
                      Shor's Algorithm (Discrete Log / Integer Factoring)
                    </td>
                    <td className="p-4 text-zinc-400 truncate max-w-[200px]" title={a.file_path || ""}>
                      {a.file_path ? a.file_path.split("/").pop() : "—"}:{a.line_start || 1}
                    </td>
                    <td className="p-4">
                      <Badge variant="solid" className="text-[10px]">
                        ML-KEM-768 / ML-DSA-65
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
