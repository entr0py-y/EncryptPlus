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
          {/* Outer Technical Dashed Ring */}
          <circle
            cx="150"
            cy="150"
            r="136"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 8"
            className="text-zinc-300 dark:text-zinc-700 opacity-60"
          />

          {/* Inner Amber Guide Ring */}
          <circle
            cx="150"
            cy="150"
            r="104"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 12"
            className="text-amber-500/30 dark:text-yellow-500/20"
          />

          {/* Subtle Background Track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            className="text-zinc-200 dark:text-zinc-800"
          />

          {/* Active Risk Gauge Arc */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#eab308"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_16px_rgba(234,179,8,0.4)]"
          />
        </svg>

        {/* Calm Central Typographic Hierarchy */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none font-mono">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-1 font-semibold">
            Overall Posture Risk
          </div>
          <div className="text-6xl font-bold tracking-tight text-zinc-950 dark:text-white leading-none">
            {riskNum.toFixed(1)}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-yellow-400 uppercase tracking-widest mt-2 font-bold">
            {overallRiskLevel} EXPOSURE
          </div>
          <div className="mt-3 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            PQC Readiness: <span className="text-amber-700 dark:text-yellow-400 font-bold">{Number(pqcReadiness || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
