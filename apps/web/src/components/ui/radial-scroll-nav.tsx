"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionItem {
  id: string;
  number: string;
  label: string;
  angle: number; // in degrees for semi-circle arc (0 deg = horizontally right from left edge)
}

// 6 Anchors distributed along a vertical right-facing semi-circle from top (-75 deg) to bottom (+75 deg)
const SECTIONS: SectionItem[] = [
  { id: "overview", number: "01", label: "Overview", angle: -75 },
  { id: "inventory", number: "02", label: "Inventory", angle: -45 },
  { id: "findings", number: "03", label: "Findings", angle: -15 },
  { id: "risk", number: "04", label: "Risk & Health", angle: 15 },
  { id: "quantum", number: "05", label: "Quantum", angle: 45 },
  { id: "migration", number: "06", label: "Migration", angle: 75 },
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
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
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
        rootMargin: "-15% 0px -55% 0px",
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

  // Semi-circle geometry parameters:
  // Center is at (0, 200) on a 260x400 SVG canvas anchored to the screen's left edge
  const centerX = 0;
  const centerY = 200;
  const radius = 135;

  const getCoordinates = (angleDeg: number, r: number = radius) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleRad),
      y: centerY + r * Math.sin(angleRad),
    };
  };

  // Construct SVG arc path for the semi-circle
  const startArc = getCoordinates(-80, radius);
  const endArc = getCoordinates(80, radius);
  const arcPath = `M ${startArc.x} ${startArc.y} A ${radius} ${radius} 0 0 1 ${endArc.x} ${endArc.y}`;

  // Inner subtle guide arc
  const innerRadius = radius - 30;
  const startInner = getCoordinates(-75, innerRadius);
  const endInner = getCoordinates(75, innerRadius);
  const innerArcPath = `M ${startInner.x} ${startInner.y} A ${innerRadius} ${innerRadius} 0 0 1 ${endInner.x} ${endInner.y}`;

  return (
    <>
      {/* 1. Desktop Fixed Left-Edge Vertical Semi-Circular Navigation */}
      <nav
        aria-label="Assessment Navigation"
        className={cn(
          "hidden xl:block fixed left-0 top-1/2 -translate-y-1/2 z-40 select-none pointer-events-auto",
          className
        )}
      >
        <div className="relative w-[280px] h-[400px]">
          {/* Subtle SVG Semi-Circular Geometry */}
          <svg
            viewBox="0 0 280 400"
            className="w-full h-full overflow-visible pointer-events-none"
          >
            {/* Inner dashed guide arc */}
            <path
              d={innerArcPath}
              fill="none"
              stroke="#1f1f23"
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            {/* Primary Semi-Circular Arc Line */}
            <path
              d={arcPath}
              fill="none"
              stroke="#27272a"
              strokeWidth="1.25"
            />

            {/* Hub Lines from left edge center to nodes */}
            {SECTIONS.map((sec) => {
              const coords = getCoordinates(sec.angle, radius);
              const isActive = activeId === sec.id;
              return (
                <g key={sec.id}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={coords.x}
                    y2={coords.y}
                    stroke={isActive ? "#52525b" : "#18181b"}
                    strokeWidth={isActive ? "1.5" : "0.75"}
                    strokeDasharray={isActive ? "none" : "2 3"}
                    className="transition-colors duration-200"
                  />
                  {/* Outer connection pulse dot */}
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

          {/* Semi-Circular Interactive Node Buttons */}
          {SECTIONS.map((sec) => {
            const coords = getCoordinates(sec.angle, radius);
            const isActive = activeId === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  left: `${coords.x + 8}px`,
                  top: `${coords.y}px`,
                  transform: "translateY(-50%)",
                }}
                className="absolute z-10 group flex items-center gap-2 focus:outline-none transition-all duration-200 cursor-pointer p-1"
                title={`Jump to ${sec.label}`}
              >
                {/* Node Pill */}
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200 whitespace-nowrap shadow-md border flex items-center gap-1.5",
                    isActive
                      ? "bg-white text-zinc-950 font-bold border-white scale-105"
                      : "bg-[#121214]/90 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                >
                  <span className="opacity-50 text-[10px]">{sec.number}</span>
                  <span className="font-sans font-medium text-xs">{sec.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Mobile Floating Sticky Chapter Header */}
      <div className="xl:hidden sticky top-14 z-30 w-full bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between overflow-x-auto gap-2 select-none text-xs">
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
          <span>Chapter:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto font-sans">
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
                <span className="font-mono text-[10px] mr-1">{sec.number}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
