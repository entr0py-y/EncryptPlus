"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantumHorizonProps {
  vulnerableCount: number;
  partialCount: number;
  safeCount: number;
  unknownCount?: number;
  className?: string;
}

export function QuantumHorizon({
  vulnerableCount = 0,
  partialCount = 0,
  safeCount = 0,
  unknownCount = 0,
  className,
}: QuantumHorizonProps) {
  const total = vulnerableCount + partialCount + safeCount + unknownCount || 1;
  const vulnPercent = Math.round((vulnerableCount / total) * 100);
  const partialPercent = Math.round((partialCount / total) * 100);
  const safePercent = Math.round((safeCount / total) * 100);
  const unknownPercent = Math.max(0, 100 - vulnPercent - partialPercent - safePercent);

  const categories = [
    {
      label: "Quantum Vulnerable",
      sublabel: "Shor's Algorithm (RSA, ECC, DH)",
      count: vulnerableCount,
      percent: vulnPercent,
      densityBar: "bg-white",
      borderTone: "border-white",
      badgeTone: "bg-white text-zinc-950 font-bold",
    },
    {
      label: "Quantum Weakened",
      sublabel: "Grover's Algorithm (AES-128, SHA-256)",
      count: partialCount,
      percent: partialPercent,
      densityBar: "bg-zinc-400",
      borderTone: "border-zinc-500",
      badgeTone: "bg-zinc-800 text-zinc-200",
    },
    {
      label: "Post-Quantum Ready",
      sublabel: "Lattice / State / Hybrid Standards",
      count: safeCount,
      percent: safePercent,
      densityBar: "bg-zinc-600",
      borderTone: "border-zinc-700",
      badgeTone: "bg-zinc-900 text-zinc-400",
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Horizon Stacked Density Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 uppercase tracking-wider">Quantum Exposure Spectrum</span>
          <span className="text-zinc-500 font-semibold">{total.toLocaleString()} Total Evaluated</span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-900 overflow-hidden flex border border-zinc-800 p-0.5">
          {vulnerableCount > 0 && (
            <div
              style={{ width: `${Math.max(4, vulnPercent)}%` }}
              className="h-full bg-white rounded-l-full transition-all duration-500"
              title={`Vulnerable: ${vulnerableCount} (${vulnPercent}%)`}
            />
          )}
          {partialCount > 0 && (
            <div
              style={{ width: `${Math.max(4, partialPercent)}%` }}
              className="h-full bg-zinc-400 transition-all duration-500 border-l border-zinc-950"
              title={`Partial: ${partialCount} (${partialPercent}%)`}
            />
          )}
          {safeCount > 0 && (
            <div
              style={{ width: `${Math.max(4, safePercent)}%` }}
              className="h-full bg-zinc-600 transition-all duration-500 border-l border-zinc-950"
              title={`Safe: ${safeCount} (${safePercent}%)`}
            />
          )}
          {unknownCount > 0 && (
            <div
              style={{ width: `${Math.max(2, unknownPercent)}%` }}
              className="h-full bg-zinc-800 transition-all duration-500 border-l border-zinc-950 rounded-r-full"
              title={`Undetermined: ${unknownCount}`}
            />
          )}
        </div>
      </div>

      {/* Discrete Spectrum Rows */}
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-2.5 h-2.5 rounded-full border", cat.densityBar, cat.borderTone)} />
              <div>
                <div className="text-xs font-semibold text-zinc-100">{cat.label}</div>
                <div className="text-[11px] font-mono text-zinc-500">{cat.sublabel}</div>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <span className="text-sm font-bold font-mono text-zinc-200">{cat.count}</span>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-md", cat.badgeTone)}>
                {cat.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
