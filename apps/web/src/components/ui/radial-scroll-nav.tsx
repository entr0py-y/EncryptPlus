"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionItem {
  id: string;
  number: string;
  label: string;
  angle: number; // in degrees for radial distribution
}

const SECTIONS: SectionItem[] = [
  { id: "overview", number: "01", label: "Overview", angle: -90 },
  { id: "inventory", number: "02", label: "Inventory", angle: -30 },
  { id: "findings", number: "03", label: "Findings", angle: 30 },
  { id: "risk", number: "04", label: "Risk & Health", angle: 90 },
  { id: "quantum", number: "05", label: "Quantum", angle: 150 },
  { id: "migration", number: "06", label: "Migration", angle: 210 },
];

export function RadialScrollNav({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const sectionElements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entry with highest intersection ratio
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by bounding client rect to find the one closest to top viewport
          const topEntry = visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          )[0];
          if (topEntry?.target?.id) {
            setActiveId(topEntry.target.id);
          }
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -50% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Radial geometry parameters (Center: 100, 100 on 200x200 canvas)
  const radius = 68;
  const getCoordinates = (angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(angleRad),
      y: 100 + radius * Math.sin(angleRad),
    };
  };

  return (
    <>
      {/* 1. Desktop Fixed Left-Edge Radial Navigation */}
      <nav
        aria-label="Assessment Navigation"
        className={cn(
          "hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none pointer-events-auto",
          className
        )}
      >
        <div className="relative w-[210px] h-[210px] flex items-center justify-center">
          {/* Subtle SVG Geometry Ring */}
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Background Circular Orbit */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.6"
            />
            <circle
              cx="100"
              cy="100"
              r="24"
              fill="none"
              stroke="#1f1f23"
              strokeWidth="1"
            />

            {/* Radial Hub Lines to Anchor Nodes */}
            {SECTIONS.map((sec) => {
              const coords = getCoordinates(sec.angle);
              const isActive = activeId === sec.id;
              return (
                <g key={sec.id}>
                  <line
                    x1="100"
                    y1="100"
                    x2={coords.x}
                    y2={coords.y}
                    stroke={isActive ? "#71717a" : "#1f1f23"}
                    strokeWidth={isActive ? "1.5" : "0.75"}
                    strokeDasharray={isActive ? "none" : "2 2"}
                    className="transition-colors duration-200"
                  />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isActive ? "4" : "2.5"}
                    fill={isActive ? "#ffffff" : "#3f3f46"}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Central Active Indicator Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-white tracking-tight">
              {SECTIONS.find((s) => s.id === activeId)?.number || "01"}
            </span>
          </div>

          {/* Satellite Interactive Click Targets & Labels */}
          {SECTIONS.map((sec) => {
            const coords = getCoordinates(sec.angle);
            const isActive = activeId === sec.id;

            // Compute percentage offset for HTML overlay positioning
            const leftPercent = (coords.x / 200) * 100;
            const topPercent = (coords.y / 200) * 100;

            // Anchor label orientation relative to circle center
            const isRightSide = coords.x >= 100;

            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={cn(
                  "absolute z-10 group flex items-center gap-1.5 focus:outline-none transition-all duration-200 cursor-pointer p-1",
                  isRightSide ? "flex-row" : "flex-row-reverse"
                )}
                title={`Go to ${sec.label}`}
              >
                {/* Node Pill / Label */}
                <div
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-mono transition-all duration-200 whitespace-nowrap shadow-sm border",
                    isActive
                      ? "bg-white text-zinc-950 font-bold border-white scale-105"
                      : "bg-[#121214]/90 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                >
                  <span className="opacity-60 mr-1">{sec.number}</span>
                  <span>{sec.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Mobile Floating Sticky Chapter Header */}
      <div className="xl:hidden sticky top-14 z-30 w-full bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between overflow-x-auto gap-2 select-none text-xs font-mono">
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-500">
          <span className="text-[10px] uppercase tracking-wider">Chapter:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {SECTIONS.map((sec) => {
            const isActive = activeId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all shrink-0 text-xs",
                  isActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                )}
              >
                {sec.number} {sec.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
