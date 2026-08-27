"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, ShieldAlert, CheckCircle2, Lock, Radio } from "lucide-react";

export default function ProtocolsPage() {
  const { id } = useParams();
  const [protoAssets, setProtoAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchScanInventory(id as string)
        .then((data) => {
          const protos = data.filter(
            (a) =>
              (a.asset_type || "").toUpperCase() === "PROTOCOL" ||
              (a.category || "").toLowerCase().includes("tls") ||
              (a.category || "").toLowerCase().includes("protocol")
          );
          setProtoAssets(protos);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const deprecatedProtos = protoAssets.filter(
    (p) => (p.algorithm || "").includes("TLS 1.0") || (p.algorithm || "").includes("TLS 1.1") || (p.algorithm || "").includes("SSL")
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Transport Layer Security & Communications
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Protocols & TLS Configurations
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Transport security audits, minimum TLS version enforcement, mTLS authentication, and cipher suites.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          <strong className="text-white">{protoAssets.length}</strong> Protocol Artefacts Discovered
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Deprecated TLS 1.0/1.1</div>
          <div className="text-3xl font-bold text-white font-mono">{deprecatedProtos.length}</div>
          <div className="text-zinc-400 text-[11px]">Requires Minimum TLS 1.3</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Mutual TLS (mTLS)</div>
          <div className="text-3xl font-bold text-white font-mono">
            {protoAssets.filter((p) => (p.algorithm || "").includes("mTLS") || (p.algorithm || "").includes("Mutual")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">Client Auth Enforcements</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Modern TLS 1.3 / 1.2</div>
          <div className="text-3xl font-bold text-white font-mono">
            {protoAssets.filter((p) => (p.algorithm || "").includes("1.3") || (p.algorithm || "").includes("1.2")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">Compliant Transport</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Protocol Mechanism</th>
                <th className="p-4">Location</th>
                <th className="p-4">Matched Token</th>
                <th className="p-4">Quantum Risk</th>
                <th className="p-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {protoAssets.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{p.algorithm || p.finding_type || "Protocol Setting"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-[200px]" title={p.file_path || ""}>
                    {p.file_path ? p.file_path.split("/").pop() : "—"}:{p.line_start || 1}
                  </td>
                  <td className="p-4 font-mono text-zinc-300">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {p.match_text || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={p.quantum_status === "VULNERABLE" ? "vulnerable" : "partial"}>
                      {p.quantum_status || "PARTIAL"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={p.severity === "CRITICAL" ? "critical" : p.severity === "HIGH" ? "high" : "low"}>
                      {p.severity || "INFO"}
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
