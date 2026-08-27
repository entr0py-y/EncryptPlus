"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Layers,
  Search,
  Shield,
  Cpu,
  Key,
  Award,
  Network,
  Package,
  Activity,
  Zap,
  Clock,
  CheckSquare,
  ArrowRightLeft,
  FileText,
  History,
  PlusCircle,
  FolderGit2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ currentScanId }: { currentScanId?: string | number }) {
  const pathname = usePathname();
  const params = useParams();
  const activeScanId = currentScanId || (params?.id as string) || "8";

  const navSections = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Scan Overview", href: `/scans/${activeScanId}`, icon: Activity },
      ],
    },
    {
      label: "SCANS & REPOSITORIES",
      items: [
        { name: "Repositories & Scans", href: "/scans", icon: FolderGit2 },
      ],
    },
    {
      label: "CRYPTOGRAPHIC ANALYSIS",
      items: [
        { name: "Crypto Inventory", href: `/scans/${activeScanId}/inventory`, icon: Layers },
        { name: "Vulnerabilities & Findings", href: `/scans/${activeScanId}/findings`, icon: Search },
        { name: "Algorithms Explorer", href: `/scans/${activeScanId}/algorithms`, icon: Cpu },
        { name: "Key Material Security", href: `/scans/${activeScanId}/keys`, icon: Key },
        { name: "X.509 Certificates", href: `/scans/${activeScanId}/certificates`, icon: Award },
        { name: "Protocols & TLS", href: `/scans/${activeScanId}/protocols`, icon: Network },
        { name: "Dependencies", href: `/scans/${activeScanId}/dependencies`, icon: Package },
      ],
    },
    {
      label: "QUANTUM & RISK INTELLIGENCE",
      items: [
        { name: "Post-Quantum Readiness", href: `/scans/${activeScanId}/quantum`, icon: Zap },
        { name: "Mosca Quantum Window", href: `/scans/${activeScanId}/mosca`, icon: Clock },
        { name: "Risk Assessment", href: `/scans/${activeScanId}/risk`, icon: Shield },
        { name: "Compliance Matrix", href: `/scans/${activeScanId}/compliance`, icon: CheckSquare },
        { name: "Migration Roadmap", href: `/scans/${activeScanId}/migration`, icon: ArrowRightLeft },
      ],
    },
    {
      label: "GOVERNANCE & REPORTING",
      items: [
        { name: "18-Section Assessment Report", href: `/scans/${activeScanId}/report`, icon: FileText },
        { name: "Historical Comparison", href: `/scans/${activeScanId}/history`, icon: History },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/80">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Minimal Geometric Brand Mark */}
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-mono font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              E+
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white font-mono leading-none">
                ENCRYPT PLUS
              </div>
              <div className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1 uppercase">
                Cryptographic Intel
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-semibold tracking-widest text-zinc-500 uppercase">
                {section.label}
              </div>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        isActive
                          ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-zinc-950" : "text-zinc-500")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-500 space-y-2">
        <div className="flex items-center justify-between">
          <span>ENGINE</span>
          <span className="text-zinc-300 font-semibold">CryptoScan v1.4</span>
        </div>
        <div className="flex items-center justify-between">
          <span>ACTIVE TARGET</span>
          <span className="text-zinc-400 truncate max-w-[120px]">Scan #{activeScanId}</span>
        </div>
      </div>
    </aside>
  );
}
