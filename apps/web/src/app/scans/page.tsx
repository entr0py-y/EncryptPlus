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
    <div className="w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Repository Management & Scan Pipeline
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white font-mono mt-1">
            Repositories & Audits
          </h1>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
            Execute AST scans, catalogue cryptographic assets, and track quantum security deltas.
          </p>
        </div>
      </div>

      {/* Scan Initiation Workspace */}
      <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-xl">
        <form onSubmit={handleLaunchScan} className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Target Repository (Git HTTPS / SSH URL or Local Directory)</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://github.com/apache/kafka.git or demo_repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
              />
            </div>

            <div className="w-full md:w-60 space-y-1.5">
              <label className="text-xs font-mono text-zinc-700 dark:text-zinc-300">Branch (Optional)</label>
              <input
                type="text"
                placeholder="main or master"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !repoUrl.trim()}
              size="lg"
              className="w-full md:w-auto h-11 px-6 font-mono text-xs gap-2 shrink-0"
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
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
              Automated Inspection Pipeline Architecture
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="text-zinc-500 text-[10px]">STAGE 01</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">Repository Clone</div>
                <div className="text-[10px] text-zinc-500 mt-1">Git fetch & isolation</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="text-zinc-500 text-[10px]">STAGE 02</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">CryptoScan AST</div>
                <div className="text-[10px] text-zinc-500 mt-1">Pattern & syntax parse</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="text-zinc-500 text-[10px]">STAGE 03</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">CBOM Discovery</div>
                <div className="text-[10px] text-zinc-500 mt-1">Asset normalization</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="text-zinc-500 text-[10px]">STAGE 04</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">Quantum & Risk</div>
                <div className="text-[10px] text-zinc-500 mt-1">Shor/Grover & Mosca</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="text-zinc-500 text-[10px]">STAGE 05</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">18-Section Report</div>
                <div className="text-[10px] text-zinc-500 mt-1">Audit generation</div>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Historical Scans Table */}
      <div className="space-y-4">
        {/* Guest Session Notice */}
        {!user && (
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-[#151208] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono transition-all shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Notice: Guest Audit Session</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold lowercase">
                    temporary
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  To save your audit history, retain private CBOM reports, and track repository risk deltas across sessions, please log in.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-colors shadow-sm"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 text-xs font-semibold transition-opacity shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            All Audited Repositories ({scans.length})
          </div>
        </div>

        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 font-semibold text-zinc-950 dark:text-white max-w-[260px] truncate" title={scan.repository_url}>
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">{scan.repository_url || "Local Workspace"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {scan.status === "COMPLETED" && (
                        <Badge variant="default" className="text-[10px]">Completed</Badge>
                      )}
                      {scan.status === "FAILED" && (
                        <Badge variant="critical" className="text-[10px]">Failed</Badge>
                      )}
                      {scan.status !== "COMPLETED" && scan.status !== "FAILED" && (
                        <Badge variant="outline" className="text-[10px] animate-pulse">
                          {scan.status}...
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(scan.started_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {scan.files_scanned.toLocaleString()} files / {scan.lines_scanned.toLocaleString()} lines
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-700 dark:text-zinc-200">
                      {scan.total_findings.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-950 dark:text-white">
                      {scan.quantum_vulnerable_count.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-950 dark:text-white">
                      {scan.overall_risk_score !== null && scan.overall_risk_score !== undefined
                        ? Number(scan.overall_risk_score).toFixed(1)
                        : "—"}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-700 dark:text-zinc-300">
                      {scan.pqc_readiness_score !== null && scan.pqc_readiness_score !== undefined
                        ? `${Number(scan.pqc_readiness_score).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 font-mono">
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
