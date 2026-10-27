"use client";

import React from "react";
import { X, Shield, Lock, Cpu, Key, FileCode, CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: DetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-all duration-300 animate-in fade-in font-mono">
      <div
        className="w-full max-w-2xl h-full bg-white dark:bg-[#0B0D10] border-l border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-7 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 text-black dark:text-white"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800/80">
            <div>
              <div className="text-[10px] font-mono text-yellow-500 dark:text-yellow-400 uppercase tracking-widest font-bold">
                Cryptographic AST Inspection
              </div>
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white mt-1 font-mono">{title}</h2>
              {subtitle && <p className="text-xs font-mono text-black dark:text-white mt-1 truncate max-w-md">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="py-6 space-y-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-black dark:text-white font-medium">
          <span>ENCRYPT PLUS AST ENGINE</span>
          <Button variant="outline" size="sm" onClick={onClose} className="border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/30 rounded-xl">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
