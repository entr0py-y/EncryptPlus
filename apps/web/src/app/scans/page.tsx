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
  }, []);

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
      router.push("/login");
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
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 space-y-7 sm:space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
            Repository Management & Scan Pipeline
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white font-mono mt-1.5">
            Repositories & Audits
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-500 dark:text-zinc-400 mt-1.5">
            Execute AST scans, catalogue cryptographic assets, and track quantum security deltas.
          </p>
        </div>
      </div>

      {/* Scan Initiation Workspace */}
      <Card className="p-6 sm:p-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-xl rounded-2xl">
        <form onSubmit={handleLaunchScan} className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs sm:text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Target Repository (Git HTTPS / SSH URL or Local Directory)</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://github.com/apache/kafka.git or demo_repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
              />
            </div>

            <div className="w-full md:w-72 space-y-2">
              <label className="text-xs sm:text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">Branch (Optional)</label>
              <input
                type="text"
                placeholder="main or master"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !repoUrl.trim()}
              size="lg"
              className="w-full md:w-auto h-12 px-8 font-mono text-xs font-semibold gap-2.5 shrink-0 rounded-xl"
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
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-3 font-medium">
              Automated Inspection Pipeline Architecture
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-xs font-mono">
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="text-zinc-500 text-[10px] font-bold">STAGE 01</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm mt-1">Repository Clone</div>
                <div className="text-[11px] text-zinc-500 mt-1">Git fetch & isolation</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="text-zinc-500 text-[10px] font-bold">STAGE 02</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm mt-1">CryptoScan AST</div>
                <div className="text-[11px] text-zinc-500 mt-1">Pattern & syntax parse</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="text-zinc-500 text-[10px] font-bold">STAGE 03</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm mt-1">CBOM Discovery</div>
                <div className="text-[11px] text-zinc-500 mt-1">Asset normalization</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="text-zinc-500 text-[10px] font-bold">STAGE 04</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm mt-1">Quantum & Risk</div>
                <div className="text-[11px] text-zinc-500 mt-1">Shor/Grover & Mosca</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="text-zinc-500 text-[10px] font-bold">STAGE 05</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm mt-1">18-Section Report</div>
                <div className="text-[11px] text-zinc-500 mt-1">Audit generation</div>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Historical Scans Table */}
      <div className="space-y-4">
        {/* Guest Session Notice */}
        {!user && (
          <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-[#151208] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono transition-all shadow-sm">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Guest Audit Session</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold lowercase">
                    temporary
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  To save your audit history, retain private CBOM reports, and track repository risk deltas across sessions, please log in.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors shadow-sm"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 text-xs sm:text-sm font-semibold transition-opacity shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            All Audited Repositories ({scans.length})
          </div>
        </div>

        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] sm:text-[11px] tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Target Repository</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5">Audited Date</th>
                  <th className="p-4 sm:p-5">Files / Lines</th>
                  <th className="p-4 sm:p-5 text-right">Occurrences</th>
                  <th className="p-4 sm:p-5 text-right">Quantum Vuln</th>
                  <th className="p-4 sm:p-5 text-right">Risk Score</th>
                  <th className="p-4 sm:p-5 text-right">PQC Ready</th>
                  <th className="p-4 sm:p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-zinc-500 font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FolderGit2 className="w-10 h-10 text-zinc-600/50" />
                        <div className="text-sm font-semibold text-zinc-400">No Audited Repositories Found</div>
                        <div className="text-xs text-zinc-500 max-w-md">
                          Enter a repository URL above and click &quot;Execute Discovery&quot; to run an automated cryptographic assessment.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-950 dark:text-white max-w-[280px] truncate" title={scan.repository_url}>
                        <div className="flex items-center gap-2.5">
                          <FolderGit2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="truncate">{scan.repository_url || "Local Workspace"}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5">
                        {scan.status === "COMPLETED" && (
                          <Badge variant="default" className="text-[10px] px-2 py-0.5">Completed</Badge>
                        )}
                        {scan.status === "FAILED" && (
                          <Badge variant="critical" className="text-[10px] px-2 py-0.5">Failed</Badge>
                        )}
                        {scan.status !== "COMPLETED" && scan.status !== "FAILED" && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 animate-pulse">
                            {scan.status}...
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-zinc-500 dark:text-zinc-400">
                        {new Date(scan.started_at).toLocaleString()}
                      </td>
                      <td className="p-4 sm:p-5 text-zinc-500 dark:text-zinc-400">
                        {scan.files_scanned.toLocaleString()} files / {scan.lines_scanned.toLocaleString()} lines
                      </td>
                      <td className="p-4 sm:p-5 text-right font-bold text-zinc-700 dark:text-zinc-200">
                        {scan.total_findings.toLocaleString()}
                      </td>
                      <td className="p-4 sm:p-5 text-right font-bold text-zinc-950 dark:text-white">
                        {scan.quantum_vulnerable_count.toLocaleString()}
                      </td>
                      <td className="p-4 sm:p-5 text-right font-bold text-zinc-950 dark:text-white">
                        {scan.overall_risk_score !== null && scan.overall_risk_score !== undefined
                          ? Number(scan.overall_risk_score).toFixed(1)
                          : "—"}
                      </td>
                      <td className="p-4 sm:p-5 text-right font-bold text-zinc-700 dark:text-zinc-300">
                        {scan.pqc_readiness_score !== null && scan.pqc_readiness_score !== undefined
                          ? `${Number(scan.pqc_readiness_score).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="p-4 sm:p-5 text-right">
                        <Link href={`/scans/${scan.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-mono px-3">
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
