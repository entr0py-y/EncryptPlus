"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchScanReport } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, CheckCircle2, Shield } from "lucide-react";

export default function FullReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number>(1);

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
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Assembling 18-Section Assessment Report...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        Assessment report data could not be generated.
      </div>
    );
  }

  const sections = report.sections || [];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Official Technical Assessment Document
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Cryptographic Security Assessment Report
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Enterprise Cryptographic Discovery & Analysis Tool (ECDAT) • SIH26164 Specification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="font-mono text-xs gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Main Reader Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Table of Contents */}
        <div className="lg:col-span-4 sticky top-24 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-3">
            18 Report Sections
          </div>
          <div className="p-2 rounded-2xl border border-zinc-800 bg-[#121215] max-h-[75vh] overflow-y-auto space-y-0.5 text-xs font-mono">
            {sections.map((s: any) => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`block px-3 py-2 rounded-xl transition-all truncate ${
                  activeSection === s.id
                    ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Right Editorial Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {sections.map((section: any) => (
            <Card
              key={section.id}
              id={`section-${section.id}`}
              className="p-8 space-y-4 scroll-mt-24 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="pb-3 border-b border-zinc-800/80 flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  {section.title}
                </h2>
                <span className="text-[10px] font-mono text-zinc-500">
                  SECTION {String(section.id).padStart(2, "0")} / 18
                </span>
              </div>

              <div className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
