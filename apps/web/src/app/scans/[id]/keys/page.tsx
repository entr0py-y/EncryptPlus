"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanInventory, CryptoAssetRecord } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, ShieldAlert, Lock, AlertTriangle, EyeOff } from "lucide-react";

export default function KeySecurityPage() {
  const { id } = useParams();
  const [keyAssets, setKeyAssets] = useState<CryptoAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchScanInventory(id as string)
        .then((data) => {
          const keys = data.filter(
            (a) =>
              (a.asset_type || "").toUpperCase() === "KEY" ||
              (a.asset_type || "").toUpperCase() === "SECRET" ||
              (a.category || "").toLowerCase().includes("secret") ||
              (a.category || "").toLowerCase().includes("key")
          );
          setKeyAssets(keys);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Redact token helper
  const redactToken = (matchStr?: string | null) => {
    if (!matchStr) return "REDACTED_KEY_MATERIAL";
    if (matchStr.includes("BEGIN") && matchStr.includes("PRIVATE KEY")) {
      return matchStr; // standard PEM header
    }
    if (matchStr.length <= 8) return "[REDACTED]";
    return `${matchStr.substring(0, 4)}...[REDACTED_SECRET]...${matchStr.substring(matchStr.length - 4)}`;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Key Material & Storage Auditing
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Key Material Security
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Auditing private keys, weak bit lengths, hardcoded secrets, and cryptographic key containers.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          <strong className="text-white">{keyAssets.length}</strong> Key Material Records Detected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Private Keys in Source</div>
          <div className="text-3xl font-bold text-white font-mono">
            {keyAssets.filter((k) => (k.algorithm || "").includes("Private Key")).length}
          </div>
          <div className="text-zinc-400 text-[11px]">Potential Exposure</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Weak Key Bit Lengths</div>
          <div className="text-3xl font-bold text-white font-mono">
            {keyAssets.filter((k) => k.key_size && k.key_size < 2048).length}
          </div>
          <div className="text-zinc-400 text-[11px]">&lt; 2048-bit RSA/DH</div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121215] space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Quantum-Vulnerable Keys</div>
          <div className="text-3xl font-bold text-white font-mono">
            {keyAssets.filter((k) => k.quantum_status === "VULNERABLE").length}
          </div>
          <div className="text-zinc-400 text-[11px]">Shor's Susceptible</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Key Classification</th>
                <th className="p-4">Location</th>
                <th className="p-4">Key Size / Format</th>
                <th className="p-4">Redacted Preview</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Quantum Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {keyAssets.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{k.algorithm || k.finding_type || "Private Key Material"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-[200px]" title={k.file_path || ""}>
                    {k.file_path ? k.file_path.split("/").pop() : "—"}:{k.line_start || 1}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {k.key_size ? `${k.key_size}-bit` : "PKCS#8 / PEM"}
                  </td>
                  <td className="p-4 font-mono text-zinc-400">
                    <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800 flex items-center gap-1.5 w-fit">
                      <EyeOff className="w-3 h-3 text-zinc-600" />
                      <span>{redactToken(k.match_text)}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={k.severity === "CRITICAL" ? "critical" : "high"}>
                      {k.severity || "HIGH"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={k.quantum_status === "VULNERABLE" ? "vulnerable" : "outline"}>
                      {k.quantum_status || "VULNERABLE"}
                    </Badge>
                  </td>
                </tr>
              ))}

              {keyAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500 font-mono text-xs">
                    No hardcoded key material or exposed private keys detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
