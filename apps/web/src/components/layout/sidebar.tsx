"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Search,
  Zap,
  ArrowRightLeft,
  FileText,
  FolderGit2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ currentScanId }: { currentScanId?: string | number }) {
  const pathname = usePathname();
  const params = useParams();
  const activeScanId = currentScanId || (params?.id as string) || "8";

  const navItems = [
    { name: "Overview", href: `/scans/${activeScanId}`, icon: LayoutDashboard },
    { name: "Crypto Inventory", href: `/scans/${activeScanId}/inventory`, icon: Layers },
    { name: "Findings", href: `/scans/${activeScanId}/findings`, icon: Search },
    { name: "Quantum & Risk", href: `/scans/${activeScanId}/quantum`, icon: Zap },
    { name: "Migration", href: `/scans/${activeScanId}/migration`, icon: ArrowRightLeft },
    { name: "Reports", href: `/scans/${activeScanId}/report`, icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/80">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-mono font-bold text-xs">
              E+
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white font-mono leading-none">
                ENCRYPT PLUS
              </div>
              <div className="text-[9px] font-mono text-zinc-500 tracking-wider mt-1 uppercase">
                Cryptographic Intel
              </div>
            </div>
          </Link>
        </div>

        {/* Minimal Navigation */}
        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all",
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-zinc-950" : "text-zinc-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-5 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 space-y-2">
        <Link href="/scans" className="flex items-center gap-2 hover:text-zinc-200 transition-colors">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>All Audits</span>
        </Link>
        <div className="pt-2 text-[10px] text-zinc-600">
          Scan #{activeScanId}
        </div>
      </div>
    </aside>
  );
}
