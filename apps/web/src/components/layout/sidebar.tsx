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
  FolderGit2,
  Bot,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/lib/auth-context";

export function Sidebar({ currentScanId }: { currentScanId?: string | number }) {
  const pathname = usePathname();
  const params = useParams();
  const activeScanId = currentScanId || (params?.id as string) || "8";
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Overview", href: `/scans/${activeScanId}`, icon: LayoutDashboard },
    { name: "Crypto Inventory", href: `/scans/${activeScanId}/inventory`, icon: Layers },
    { name: "Findings", href: `/scans/${activeScanId}/findings`, icon: Search },
    { name: "Quantum & Risk", href: `/scans/${activeScanId}/quantum`, icon: Zap },
    { name: "Migration", href: `/scans/${activeScanId}/migration`, icon: ArrowRightLeft },
    { name: "Reports", href: `/scans/${activeScanId}/report`, icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/80">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-6 h-6 text-black dark:text-white shrink-0" />
            <div>
              <div className="text-sm font-bold tracking-tight text-black dark:text-white font-mono leading-none">
                ENCRYPT PLUS
              </div>
              <div className="text-[9px] font-mono text-black dark:text-white tracking-wider mt-1 uppercase font-semibold">
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
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-bold shadow-sm"
                    : "text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white dark:text-black" : "text-black dark:text-white")} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-agent-drawer"));
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-amber-50 dark:hover:bg-yellow-950/30 border border-amber-300 dark:border-yellow-500/20 font-bold"
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-yellow-500 dark:text-yellow-400 shrink-0" />
                <span>AI Assistant</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-yellow-500/20 text-yellow-500 dark:text-yellow-400 uppercase tracking-wider font-bold">
                MEMORY
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Status & User Profile */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3 font-mono">
        <div className="flex items-center justify-between text-[11px] text-black dark:text-white">
          <Link href="/scans" className="flex items-center gap-2 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>All Audits</span>
          </Link>
          <span className="text-[10px] text-black dark:text-white">Scan #{activeScanId}</span>
        </div>

        {user && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-black dark:text-white truncate">
                  {user.name || "Operator"}
                </div>
                <div className="text-[10px] text-black dark:text-white truncate font-mono">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
