"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAsset, CryptoAssetRecord } from "@/lib/api";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldAlert,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  FileCode,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Layers
} from "lucide-react";

export default function FindingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const assetId = params?.asset_id as string;

  const [asset, setAsset] = useState<CryptoAssetRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && assetId) {
      fetchAsset(id, assetId)
        .then(setAsset)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, assetId]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Finding Telemetry...
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500 space-y-4">
        <div>Finding #{assetId} could not be located in Scan #{id}.</div>
        <Link href={`/scans/${id}/findings`}>
          <Button variant="outline" size="sm">Back to Findings</Button>
        </Link>
      </div>
    );
  }

  // Recommended PQC algorithm target
  const getRecommendedTarget = (algoStr: string) => {
    const u = algoStr.toUpperCase();
    if (u.includes("RSA") && u.includes("SIG")) return "ML-DSA-65 / SLH-DSA";
    if (u.includes("RSA") || u.includes("DH")) return "ML-KEM-768 (Lattice-Based)";
    if (u.includes("ECDSA") || u.includes("ECC")) return "ML-DSA-44 or ML-DSA-65";
    if (u.includes("AES-128")) return "AES-256 (Quantum Grover Margin)";
    if (u.includes("MD5") || u.includes("SHA-1")) return "SHA-256 / SHA-3 (Classically Secure)";
    return "ML-KEM-768 or ML-DSA-65";
  };

  const targetAlgo = getRecommendedTarget(asset.algorithm || asset.finding_type || "");

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <Link
          href={`/scans/${id}/findings`}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Findings Queue</span>
        </Link>

        <div className="flex items-center gap-2">
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
            {asset.severity} SEVERITY
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            ID: #{asset.id}
          </Badge>
        </div>
      </div>

      {/* Hero Finding Banner */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#121215] space-y-2">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Cryptographic Vulnerability Audit
        </div>
        <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
          {asset.algorithm || asset.finding_type || "Undetermined Cryptographic Finding"}
        </h1>
        <p className="text-xs font-mono text-zinc-400">
          {asset.description || "Identified cryptographic artefact through deep pattern inspection."}
        </p>
      </div>

      {/* 3-Column Detailed Investigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Finding Metadata */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Technical Specification
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Asset Type</span>
                <span className="font-semibold text-white">{asset.asset_type}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Category</span>
                <span className="font-semibold text-white">{asset.category || "General"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Primitive</span>
                <span className="font-semibold text-white">{asset.primitive || "General"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Key Size / Parameters</span>
                <span className="font-semibold text-white">
                  {asset.key_size ? `${asset.key_size}-bit` : "Not Specified"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Confidence</span>
                <span className="font-semibold text-white">{asset.confidence || "HIGH"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">Language</span>
                <span className="font-semibold text-white">{asset.language || "Java / Go / Py"}</span>
              </div>
            </div>
          </Card>

          {/* Location Details */}
          <Card className="p-5 space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Source Location
            </div>
            <div className="text-xs font-mono text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 break-all leading-relaxed">
              <div>{asset.file_path}</div>
              <div className="text-zinc-500 mt-1">Line: {asset.line_start || 1} • Column: {asset.column || 0}</div>
            </div>
          </Card>
        </div>

        {/* Center Column: Code Evidence */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              AST Token Match & Context Evidence
            </div>
            <CodeEvidence
              filePath={asset.file_path}
              lineNumber={asset.line_start}
              column={asset.column}
              matchText={asset.match_text}
              contextText={asset.context}
              sourceContextJson={asset.source_context_json}
            />
          </div>

          {/* Mosca Assessment Panel */}
          <Card className="p-6 space-y-4 border-zinc-700 bg-[#121215]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Quantum Exposure Model
                </div>
                <h3 className="text-base font-bold text-white font-mono mt-0.5">
                  Mosca's Inequality Assessment
                </h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">X + Y &gt; Z</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-center">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-zinc-500 text-[10px]">Data Lifetime (X)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {asset.data_lifetime && asset.data_lifetime !== "UNKNOWN" ? asset.data_lifetime : "5–10 Years"}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-zinc-500 text-[10px]">Migration Time (Y)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {asset.migration_time && asset.migration_time !== "UNKNOWN" ? asset.migration_time : "2–3 Years"}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-zinc-500 text-[10px]">CRQC Horizon (Z)</div>
                <div className="text-base font-bold text-white mt-0.5">~10 Years (Scenario)</div>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              Under current intelligence assumptions, cryptographic data protected by {asset.algorithm || "this mechanism"} is vulnerable to <strong className="text-white">Harvest Now, Decrypt Later (HNDL)</strong> adversaries who store intercepted ciphertext today to decrypt once a Cryptanalytically Relevant Quantum Computer (CRQC) becomes operational.
            </p>
          </Card>

          {/* Recommended Action & Migration Target */}
          <Card className="p-6 space-y-4 border-zinc-700 bg-[#121215]">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Remediation & Migration Strategy
              </div>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                Recommended Migration Target
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950 gap-4 font-mono text-xs">
              <div>
                <div className="text-zinc-500 text-[10px]">CURRENT ALGORITHM</div>
                <div className="text-sm font-bold text-white mt-0.5">{asset.algorithm || "Classical Primitive"}</div>
              </div>

              <ArrowRight className="w-5 h-5 text-zinc-500 shrink-0 hidden sm:block" />

              <div>
                <div className="text-zinc-500 text-[10px]">TARGET PQC STANDARD</div>
                <div className="text-sm font-bold text-white mt-0.5">{targetAlgo}</div>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              {asset.remediation || "Refactor code to implement hybrid post-quantum key encapsulation or lattice-based signature algorithms compliant with NIST FIPS 203/204 standards."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
