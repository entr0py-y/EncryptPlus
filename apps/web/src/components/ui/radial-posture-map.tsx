"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RadialPostureMapProps {
  overallRisk: number;
  overallRiskLevel: string;
  pqcReadiness: number;
  pqcReadinessLevel?: string;
  totalFindings?: number;
  quantumVulnerable?: number;
  className?: string;
}

export function RadialPostureMap({
  overallRisk = 0,
  overallRiskLevel = "LOW",
  pqcReadiness = 0,
  className,
}: RadialPostureMapProps) {
  const riskNum = Number(overallRisk || 0);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Progress offset for 270-degree arc
  const arcLength = circumference * 0.75;
  const strokeOffset = arcLength * (1 - Math.min(Math.max(riskNum, 0), 100) / 100);

  return (
    <div className={cn("relative flex flex-col items-center justify-center select-none py-6", className)}>
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full -rotate-[135deg]"
        >
          {/* Subtle Background Track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#1f1f23"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Risk Gauge Arc */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Calm Central Typographic Hierarchy */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            Overall Posture Risk
          </div>
          <div className="text-6xl font-bold tracking-tight text-white font-mono leading-none">
            {riskNum.toFixed(1)}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mt-2 font-medium">
            {overallRiskLevel} EXPOSURE
          </div>
          <div className="mt-3 text-[11px] font-mono text-zinc-500">
            PQC Readiness: <span className="text-zinc-300 font-semibold">{Number(pqcReadiness || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
