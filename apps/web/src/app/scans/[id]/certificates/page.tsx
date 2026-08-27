"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck, AlertCircle, FileCode, CheckCircle2 } from "lucide-react";

export default function CertificatesPage() {
  const { id } = useParams();
  const [certAssets, setCertAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchScanInventory(id as string)
        .then((data) => {
          const certs = data.filter(
            (a) =>
              (a.asset_type || "").toUpperCase() === "CERTIFICATE" ||
              (a.category || "").toLowerCase().includes("certificate")
          );
          setCertAssets(certs);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Public Key Infrastructure (PKI)
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            X.509 Certificates & Trust Anchors
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Auditing certificate lifecycles, expiration checks, signature suites, trust chains, and key usage extensions.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          <strong className="text-white">{certAssets.length}</strong> Certificate Operations Catalogued
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Expiration Checks</div>
          <div className="text-3xl font-bold text-white font-mono">
            {certAssets.filter((c) => (c.algorithm || "").includes("Expiration")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">Validity Audits</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Signature Algorithms</div>
          <div className="text-3xl font-bold text-white font-mono">
            {certAssets.filter((c) => (c.algorithm || "").includes("Signature")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">RSA & ECDSA Signatures</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Pinning & Chains</div>
          <div className="text-3xl font-bold text-white font-mono">
            {certAssets.filter((c) => (c.algorithm || "").includes("Pinning") || (c.algorithm || "").includes("Chain")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">Trust Anchor Validations</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Certificate Mechanism</th>
                <th className="p-4">Location</th>
                <th className="p-4">Code Token Match</th>
                <th className="p-4">Quantum Risk</th>
                <th className="p-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {certAssets.slice(0, 100).map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{c.algorithm || c.finding_type || "X.509 Certificate Asset"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-[200px]" title={c.file_path || ""}>
                    {c.file_path ? c.file_path.split("/").pop() : "—"}:{c.line_start || 1}
                  </td>
                  <td className="p-4 font-mono text-zinc-300">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {c.match_text || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={c.quantum_status === "VULNERABLE" ? "vulnerable" : "outline"}>
                      {c.quantum_status || "UNKNOWN"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={c.severity === "CRITICAL" ? "critical" : "low"}>
                      {c.severity || "INFO"}
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
