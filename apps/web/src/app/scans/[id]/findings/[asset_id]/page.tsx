"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchAsset, CryptoAssetRecord } from "@/lib/api";
import { CodeEvidence } from "@/components/ui/code-evidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FindingDetailPage() {
  const params = useParams();
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
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Finding...
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-16 text-center text-xs font-mono text-zinc-500 space-y-4">
        <div>Finding #{assetId} not found.</div>
        <Link href={`/scans/${id}/findings`}>
          <Button variant="outline" size="sm">Back to Findings</Button>
        </Link>
      </div>
    );
  }

  // Recommended PQC target
  const getRecommendedTarget = (algoStr: string) => {
    const u = algoStr.toUpperCase();
    if (u.includes("RSA") && u.includes("SIG")) return "ML-DSA-65 / SLH-DSA";
    if (u.includes("RSA") || u.includes("DH")) return "ML-KEM-768";
    if (u.includes("ECDSA") || u.includes("ECC")) return "ML-DSA-44 or ML-DSA-65";
    if (u.includes("AES-128")) return "AES-256";
    if (u.includes("MD5") || u.includes("SHA-1")) return "SHA-256 / SHA-3";
    return "ML-KEM-768";
  };

  const targetAlgo = getRecommendedTarget(asset.algorithm || asset.finding_type || "");

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10 select-none font-mono">
      {/* Back Link */}
      <div>
        <Link
          href={`/scans/${id}/findings`}
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Findings</span>
        </Link>
      </div>

      {/* 1. Header Overview Surface */}
      <div className="p-6 rounded-2xl border border-zinc-800/80 bg-[#121214] space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Finding Specification
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {asset.algorithm || asset.finding_type || "Cryptographic Mechanism"}
            </h1>
          </div>
          <Badge
            variant={
              asset.severity === "CRITICAL"
                ? "critical"
                : asset.severity === "HIGH"
                ? "high"
                : "medium"
            }
          >
            {asset.severity || "INFO"}
          </Badge>
        </div>

        {/* 4-Item Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div>
            <div className="text-zinc-500 text-[10px]">Usage</div>
            <div className="font-semibold text-white mt-0.5">{asset.category || "General"}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">Location</div>
            <div className="font-semibold text-white mt-0.5 truncate" title={asset.file_path || ""}>
              {asset.file_path ? asset.file_path.split("/").pop() : "—"}:{asset.line_start || 1}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">Quantum Posture</div>
            <div className="font-semibold text-white mt-0.5">{asset.quantum_status || "UNKNOWN"}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">Risk Score</div>
            <div className="font-semibold text-white mt-0.5">
              {asset.risk_score ? Number(asset.risk_score).toFixed(0) : "25"} / 100
            </div>
          </div>
        </div>
      </div>

      {/* 2. Code Evidence */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Code Evidence
        </div>
        <CodeEvidence
          filePath={asset.file_path}
          lineNumber={asset.line_start}
          matchText={asset.match_text}
          contextText={asset.context}
          sourceContextJson={asset.source_context_json}
        />
      </div>

      {/* 3. Assessment & Recommendation */}
      <div className="p-6 rounded-2xl border border-zinc-800/80 bg-[#121214] space-y-6 text-xs leading-relaxed">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Why It Matters
          </div>
          <p className="text-zinc-300">
            {asset.description || "Identified classical cryptographic primitive that is susceptible to cryptanalysis or post-quantum Shor/Grover algorithms."}
          </p>
        </div>

        <div className="space-y-2 pt-4 border-t border-zinc-800/80">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Recommendation & Migration Target
          </div>
          <div className="flex items-center gap-3 py-2 text-sm font-semibold text-white">
            <span>{asset.algorithm || "Current"}</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-200">{targetAlgo}</span>
          </div>
          <p className="text-zinc-400">
            {asset.remediation || "Replace deprecated or quantum-vulnerable primitive with NIST-standardized post-quantum lattice algorithms (FIPS 203/204)."}
          </p>
        </div>
      </div>
    </div>
  );
}
