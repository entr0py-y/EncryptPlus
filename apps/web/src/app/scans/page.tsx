"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchScans, createScan, ScanRecord } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  Play,
  ArrowRight,
  GitBranch,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ScansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadScans();
  }, [user]);

  const loadScans = async () => {
    try {
      const data = await fetchScans();
      const sorted = data.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      setScans(sorted);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
      return;
    }
    if (!repoUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await createScan(repoUrl.trim(), branch.trim() || undefined);
      setRepoUrl("");
      setBranch("");
      if (res?.scan_id) {
        router.push(`/scans/${res.scan_id}`);
      } else {
        await loadScans();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create scan. Please verify the URL or path.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
            Repositories & Audits
          </h1>
          <p className="text-xs font-mono text-yellow-500 dark:text-yellow-400 mt-1">
            Execute AST scans, catalogue cryptographic assets, and track quantum security deltas.
          </p>
        </div>
      </div>

      {/* Scan Initiation Workspace */}
      <Card className="p-7 sm:p-9 border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent shadow-xl">
        <form onSubmit={handleLaunchScan} className="space-y-7 sm:space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-mono text-black dark:text-white flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span>Target Repository (Git HTTPS / SSH URL or Local Directory)</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://github.com/apache/kafka.git or demo_repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 text-sm font-mono text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
              />
            </div>

            <div className="w-full md:w-64 space-y-2">
              <label className="text-xs font-mono text-black dark:text-white">Branch (Optional)</label>
              <input
                type="text"
                placeholder="main or master"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/20 text-sm font-mono text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !repoUrl.trim()}
              size="lg"
              className="w-full md:w-auto h-12 px-7 font-mono text-xs gap-2 shrink-0 btn-yellow-hover"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Discovery</span>
                </>
              )}
            </Button>
          </div>

          {/* Stepper Pipeline Indicator */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800/60">
            <div className="text-xs font-mono text-black dark:text-white uppercase tracking-widest mb-3.5 font-semibold">
              Automated Inspection Pipeline Architecture
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono">
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-black dark:text-white text-xs font-semibold">STAGE 01</div>
                <div className="text-sm sm:text-[15px] font-bold text-black dark:text-white mt-1 leading-snug">Repository Clone</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5 font-medium leading-normal">Git fetch & isolation</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-black dark:text-white text-xs font-semibold">STAGE 02</div>
                <div className="text-sm sm:text-[15px] font-bold text-black dark:text-white mt-1 leading-snug">CryptoScan AST</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5 font-medium leading-normal">Pattern & syntax parse</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-black dark:text-white text-xs font-semibold">STAGE 03</div>
                <div className="text-sm sm:text-[15px] font-bold text-black dark:text-white mt-1 leading-snug">CBOM Discovery</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5 font-medium leading-normal">Asset normalization</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-black dark:text-white text-xs font-semibold">STAGE 04</div>
                <div className="text-sm sm:text-[15px] font-bold text-black dark:text-white mt-1 leading-snug">Quantum & Risk</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5 font-medium leading-normal">Shor/Grover & Mosca</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="text-black dark:text-white text-xs font-semibold">STAGE 05</div>
                <div className="text-sm sm:text-[15px] font-bold text-black dark:text-white mt-1 leading-snug">10-Section Report</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5 font-medium leading-normal">Audit generation</div>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Guest Session Notice */}
      {!user && (
        <div
          style={{ background: "linear-gradient(135deg, #eab308 0%, #fde047 50%, #fef08a 100%)" }}
          className="p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 font-mono transition-all shadow-none dark:shadow-[0_0_25px_rgba(234,179,8,0.4)] border-0"
        >
          <div className="p-2.5 rounded-xl bg-black/10 text-black shrink-0">
            <ShieldAlert className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <span>Notice: Guest Audit Session</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 text-black font-semibold lowercase">
                temporary
              </span>
            </div>
            <p className="text-xs text-black mt-1 leading-relaxed font-medium">
              To save your audit history, retain private CBOM reports, and track repository risk deltas across sessions, please log in.
            </p>
          </div>
        </div>
      )}

      {/* Historical Scans Table */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-black dark:text-white uppercase tracking-wider">
            All Audited Repositories ({scans.length})
          </div>
        </div>

        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-transparent">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/20 border-b border-zinc-200/80 dark:border-zinc-800/60 text-black dark:text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Target Repository</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Audited Date</th>
                  <th className="p-4">Files / Lines</th>
                  <th className="p-4 text-right">Occurrences</th>
                  <th className="p-4 text-right">Quantum Vuln</th>
                  <th className="p-4 text-right">Risk Score</th>
                  <th className="p-4 text-right">PQC Ready</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/40">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4 font-semibold text-black dark:text-white max-w-[260px] truncate" title={scan.repository_url}>
                      <Link href={`/scans/${scan.id}`} className="flex items-center gap-2 hover:underline">
                        <FolderGit2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                        <span className="truncate">{scan.repository_url || "Local Workspace"}</span>
                      </Link>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {scan.status === "COMPLETED" && (
                        <span className="text-yellow-500 dark:text-yellow-400 font-medium">Completed</span>
                      )}
                      {scan.status === "FAILED" && (
                        <span className="text-black dark:text-white font-medium">Failed</span>
                      )}
                      {scan.status !== "COMPLETED" && scan.status !== "FAILED" && (
                        <span className="text-yellow-500 dark:text-yellow-400 animate-pulse font-medium">{scan.status}...</span>
                      )}
                    </td>
                    <td className="p-4 text-black dark:text-white">
                      {new Date(scan.started_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-black dark:text-white">
                      {scan.files_scanned.toLocaleString()} files / {scan.lines_scanned.toLocaleString()} lines
                    </td>
                    <td className="p-4 text-right font-bold text-black dark:text-white">
                      {scan.total_findings.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-black dark:text-white">
                      {scan.quantum_vulnerable_count.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-black dark:text-white">
                      {scan.overall_risk_score !== null && scan.overall_risk_score !== undefined
                        ? Number(scan.overall_risk_score).toFixed(1)
                        : "—"}
                    </td>
                    <td className="p-4 text-right font-bold text-black dark:text-white">
                      {scan.pqc_readiness_score !== null && scan.pqc_readiness_score !== undefined
                        ? `${Number(scan.pqc_readiness_score).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/scans/${scan.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 font-mono text-black dark:text-white"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
