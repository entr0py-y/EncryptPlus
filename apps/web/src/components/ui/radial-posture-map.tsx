"use client";

import React, { useState } from "react";
import { Shield, Lock, Key, Award, Cpu, Network, FileCode, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadialPostureMapProps {
  overallRisk: number;
  overallRiskLevel: string;
  pqcReadiness: number;
  pqcReadinessLevel: string;
  totalFindings: number;
  quantumVulnerable: number;
  quantumPartial: number;
  quantumSafe: number;
  filesScanned: number;
  algorithmsCount?: number;
  certificatesCount?: number;
  keysCount?: number;
  protocolsCount?: number;
  className?: string;
}

export function RadialPostureMap({
  overallRisk = 0,
  overallRiskLevel = "LOW",
  pqcReadiness = 0,
  pqcReadinessLevel = "DEVELOPING",
  totalFindings = 0,
  quantumVulnerable = 0,
  quantumPartial = 0,
  quantumSafe = 0,
  filesScanned = 0,
  algorithmsCount = 0,
  certificatesCount = 0,
  keysCount = 0,
  protocolsCount = 0,
  className,
}: RadialPostureMapProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Satellite node definitions orbiting the central core
  const satellites = [
    {
      id: "algorithms",
      label: "Algorithms",
      count: algorithmsCount || Math.round(totalFindings * 0.15) || 12,
      subtitle: `${quantumVulnerable} Vulnerable`,
      icon: Cpu,
      angle: 310, // top-left
      radius: 185,
    },
    {
      id: "certificates",
      label: "X.509 PKI",
      count: certificatesCount || Math.round(totalFindings * 0.7) || 84,
      subtitle: "Lifecycles & Chains",
      icon: Award,
      angle: 45, // top-right
      radius: 195,
    },
    {
      id: "keys",
      label: "Key Material",
      count: keysCount || 8,
      subtitle: "Asymmetric & Private",
      icon: Key,
      angle: 140, // bottom-right
      radius: 190,
    },
    {
      id: "protocols",
      label: "Transport & TLS",
      count: protocolsCount || 18,
      subtitle: "Negotiated Suites",
      icon: Network,
      angle: 220, // bottom-left
      radius: 180,
    },
  ];

  // Calculate coordinates on the circle
  const getCoordinates = (angleDeg: number, r: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: 240 + r * Math.cos(angleRad),
      y: 240 + r * Math.sin(angleRad),
    };
  };

  // Generate tick marks along the orbit
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      <svg
        viewBox="0 0 480 480"
        className="w-full max-w-[460px] h-auto overflow-visible"
      >
        <defs>
          {/* Subtle monochrome gradient for the central orb */}
          <radialGradient id="centralCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1c20" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#121215" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0a0a0c" stopOpacity="1" />
          </radialGradient>

          {/* Radar sweep gradient */}
          <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Outer glow ring */}
          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Outer Orbital Bounds */}
        <circle
          cx="240"
          cy="240"
          r="230"
          fill="none"
          stroke="#18181b"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
        <circle
          cx="240"
          cy="240"
          r="190"
          fill="none"
          stroke="#27272a"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <circle
          cx="240"
          cy="240"
          r="140"
          fill="none"
          stroke="#27272a"
          strokeWidth="1"
          strokeDasharray="4 8"
          strokeOpacity="0.8"
        />

        {/* Orbit Tick Marks */}
        {ticks.map((deg, i) => {
          const isMajor = deg % 30 === 0;
          const outer = getCoordinates(deg, 192);
          const inner = getCoordinates(deg, isMajor ? 182 : 187);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isMajor ? "#52525b" : "#27272a"}
              strokeWidth={isMajor ? 1.5 : 1}
            />
          );
        })}

        {/* Connecting Axis Lines */}
        <line x1="40" y1="240" x2="440" y2="240" stroke="#1f1f23" strokeWidth="0.75" strokeDasharray="2 4" />
        <line x1="240" y1="40" x2="240" y2="440" stroke="#1f1f23" strokeWidth="0.75" strokeDasharray="2 4" />

        {/* Connecting Beams to Satellites */}
        {satellites.map((sat) => {
          const coords = getCoordinates(sat.angle, sat.radius);
          const isHovered = activeNode === sat.id;
          return (
            <g key={sat.id}>
              <line
                x1="240"
                y1="240"
                x2={coords.x}
                y2={coords.y}
                stroke={isHovered ? "#71717a" : "#27272a"}
                strokeWidth={isHovered ? 1.5 : 1}
                strokeDasharray={isHovered ? "none" : "3 3"}
                className="transition-all duration-300"
              />
              <circle
                cx={coords.x}
                cy={coords.y}
                r="3"
                fill={isHovered ? "#ffffff" : "#52525b"}
              />
            </g>
          );
        })}

        {/* Radar Sweep Line */}
        <g className="origin-[240px_240px] animate-radar">
          <line
            x1="240"
            y1="240"
            x2="240"
            y2="50"
            stroke="url(#radarSweep)"
            strokeWidth="1.5"
          />
        </g>

        {/* Central Core Circle */}
        <circle
          cx="240"
          cy="240"
          r="105"
          fill="url(#centralCoreGrad)"
          stroke="#3f3f46"
          strokeWidth="1.5"
          className="shadow-2xl"
        />

        {/* Inner Progress Track Arc (PQC Readiness) */}
        <circle
          cx="240"
          cy="240"
          r="95"
          fill="none"
          stroke="#27272a"
          strokeWidth="4"
        />
        <circle
          cx="240"
          cy="240"
          r="95"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeDasharray={2 * Math.PI * 95}
          strokeDashoffset={2 * Math.PI * 95 * (1 - (pqcReadiness || 0) / 100)}
          strokeLinecap="round"
          transform="rotate(-90 240 240)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Central Core Content (HTML Overlay for crisp typography) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 mb-1">
          Posture Risk Score
        </div>
        <div className="text-5xl font-bold tracking-tight text-white font-mono leading-none">
          {Number(overallRisk || 0).toFixed(1)}
        </div>
        <div className="mt-1 text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
          {overallRiskLevel} EXPOSURE
        </div>
        <div className="mt-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <span className="text-zinc-200 font-semibold">{pqcReadiness.toFixed(1)}%</span> PQC Ready
        </div>
      </div>

      {/* Satellite Node HTML Overlay Badges */}
      {satellites.map((sat) => {
        const coords = getCoordinates(sat.angle, sat.radius);
        const Icon = sat.icon;
        const isHovered = activeNode === sat.id;

        // Position offsets
        const leftPercent = (coords.x / 480) * 100;
        const topPercent = (coords.y / 480) * 100;

        return (
          <div
            key={sat.id}
            onMouseEnter={() => setActiveNode(sat.id)}
            onMouseLeave={() => setActiveNode(null)}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: "translate(-50%, -50%)",
            }}
            className={cn(
              "absolute z-10 cursor-pointer rounded-xl border p-2.5 transition-all duration-200 flex items-center gap-2.5 shadow-lg backdrop-blur-md",
              isHovered
                ? "border-white bg-zinc-900 text-white scale-105"
                : "border-zinc-800 bg-[#121215]/90 text-zinc-300 hover:border-zinc-600"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg border",
              isHovered ? "bg-white text-zinc-950 border-white" : "bg-zinc-900 text-zinc-400 border-zinc-800"
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tracking-tight">{sat.label}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200">
                  {sat.count}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono leading-tight">{sat.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
