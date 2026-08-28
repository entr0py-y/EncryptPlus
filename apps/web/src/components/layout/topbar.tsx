"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus, GitBranch, ChevronDown } from "lucide-react";
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
      <header className="h-14 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between select-none font-sans">
        {/* Left: Active Scan & Repository Context Pill (Preserving font-mono only here) */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowScanDropdown(!showScanDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-zinc-900 hover:border-zinc-700 transition-all text-xs font-mono text-zinc-200"
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-white max-w-[200px] truncate font-mono">
                {activeScan?.repository_url ? activeScan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "") : "Select Scan Target"}
              </span>
              {activeScan && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  #{activeScan.id}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            </button>

            {/* Scan Switcher Dropdown */}
            {showScanDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
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
                        "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors",
                        s.id === activeId ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      )}
                    >
                      <div className="truncate max-w-[180px]">
                        <div className="truncate text-zinc-200 font-medium font-mono">
                          {s.repository_url ? s.repository_url.split("/").pop() : "Local Demo"}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {s.total_findings || 0} findings • {s.status}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-zinc-300 font-mono">
                          {s.overall_risk_score !== null && s.overall_risk_score !== undefined ? `${Number(s.overall_risk_score).toFixed(1)}` : "—"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowScanModal(true)}
            size="sm"
            className="gap-2 shadow-sm text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </Button>
        </div>
      </header>

      {/* New Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in font-sans">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Discovery Engine
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Scan Repository
              </h3>
              <p className="text-xs text-zinc-400">
                Initiate cryptographic discovery and post-quantum assessment.
              </p>
            </div>

            <form onSubmit={handleStartScan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300">
                  Target Repository URL or Local Directory
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/org/repo.git or demo_repo"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-800 bg-[#09090b] text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300">
                  Git Branch (Optional)
                </label>
                <input
                  type="text"
                  placeholder="main or master"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-800 bg-[#09090b] text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  className="text-xs font-medium"
                >
                  {submitting ? "Initiating..." : "Execute Scan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
