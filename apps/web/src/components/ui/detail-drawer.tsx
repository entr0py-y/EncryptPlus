"use client";

import React from "react";
import { X, Shield, Lock, Cpu, Key, FileCode, CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEvidence } from "@/components/ui/code-evidence";
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div
        className="w-full max-w-2xl h-full bg-[#101012] border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-zinc-800/80">
            <div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                Cryptographic Inspection
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">{title}</h2>
              {subtitle && <p className="text-xs font-mono text-zinc-400 mt-1 truncate max-w-md">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
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
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>ENCRYPT PLUS INSPECTION ENGINE</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
