"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus, Search, GitBranch, Terminal, Shield, RefreshCw, ChevronDown, Check } from "lucide-react";
import { fetchScans, createScan, ScanRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id ? Number(params.id) : null;

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showScanDropdown, setShowScanDropdown] = useState(false);

  useEffect(() => {
    fetchScans()
      .then((data) => {
        const sorted = data.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        setScans(sorted);
      })
      .catch(console.error);
  }, [activeId]);

  const activeScan = scans.find((s) => s.id === activeId) || scans[0];

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await createScan(repoInput.trim(), branchInput.trim() || undefined);
      setShowScanModal(false);
      setRepoInput("");
      setBranchInput("");
      if (res?.scan_id) {
        router.push(`/scans/${res.scan_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate scan. Please check the repository path/URL.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 bg-[#0c0c0e]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between select-none">
        {/* Left: Active Scan & Repository Context */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowScanDropdown(!showScanDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-xs font-mono text-zinc-200"
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-white max-w-[200px] truncate">
                {activeScan?.repository_url ? activeScan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "") : "Select Scan Target"}
              </span>
              {activeScan && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  #{activeScan.id}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            </button>

            {/* Scan Switcher Dropdown */}
            {showScanDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Available Repository Scans
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {scans.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setShowScanDropdown(false);
                        router.push(`/scans/${s.id}`);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-mono transition-colors",
                        s.id === activeId ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      )}
                    >
                      <div className="truncate max-w-[180px]">
                        <div className="truncate text-zinc-200 font-medium">
                          {s.repository_url ? s.repository_url.split("/").pop() : "Local Demo"}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {s.total_findings || 0} findings • {s.status}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-zinc-300">
                          {s.overall_risk_score !== null && s.overall_risk_score !== undefined ? `${Number(s.overall_risk_score).toFixed(1)}` : "—"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeScan?.status === "COMPLETED" && (
            <Badge variant="default" className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-300">
              AUDITED • {activeScan.total_findings} ARTEFACTS
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowScanModal(true)}
            size="sm"
            className="gap-2 shadow-sm font-mono text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </Button>
        </div>
      </header>

      {/* New Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Cryptographic Discovery Engine
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Scan Repository
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Initiate deep AST and pattern analysis for classical and post-quantum cryptography.
              </p>
            </div>

            <form onSubmit={handleStartScan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">
                  Target Repository URL or Local Directory
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/org/repo.git or demo_repo"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">
                  Git Branch (Optional)
                </label>
                <input
                  type="text"
                  placeholder="main, master, or leave empty"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>

              {/* 5-Stage Stepper Preview */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-2">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Automated Inspection Pipeline
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200">1. Clone</div>
                  <div className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">2. Parse</div>
                  <div className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">3. Classify</div>
                  <div className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">4. Quantum</div>
                  <div className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">5. Report</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowScanModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !repoInput.trim()}
                  className="font-mono text-xs"
                >
                  {submitting ? "Initiating Engine..." : "Execute Scan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
