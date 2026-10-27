"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

export default function FullReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchScanReport(id as string)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[70vh] space-y-4 font-mono">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
        <div className="text-xs text-black dark:text-white uppercase tracking-widest">
          Assembling 18-Section Assessment Document...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-16 text-center text-xs font-mono text-black dark:text-white">
        Assessment report data could not be generated.
      </div>
    );
  }

  const sections = report.sections || [];

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12 select-none font-mono">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-yellow-500 dark:text-yellow-400 font-bold">
            Official Technical Assessment Document
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mt-1">
            CRYPTOGRAPHIC AUDIT REPORT
          </h1>
          <p className="text-xs text-black dark:text-white mt-1 font-medium">
            ENCRYPT PLUS • Scan #{id} • 18 Structured Sections
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="font-mono text-xs gap-2 shrink-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/30 rounded-xl"
        >
          <Printer className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Print Document</span>
        </Button>
      </div>

      {/* Document Body (Clean Typography, Numbered Sections) */}
      <div className="space-y-10">
        {sections.map((section: any) => (
          <article
            key={section.id}
            id={`section-${section.id}`}
            className="space-y-3 pb-8 border-b border-zinc-200 dark:border-zinc-800/60"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
                {section.title}
              </h2>
              <span className="text-[10px] text-yellow-500 dark:text-yellow-400 font-bold">
                {String(section.id).padStart(2, "0")} / 18
              </span>
            </div>

            <div className="text-xs text-black dark:text-white leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
