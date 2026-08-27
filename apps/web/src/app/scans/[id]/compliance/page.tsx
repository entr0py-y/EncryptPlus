"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchCompliance } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

export default function CompliancePage() {
  const { id } = useParams();
  const [compliance, setCompliance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>("ALL");

  useEffect(() => {
    if (id) {
      fetchCompliance(id as string)
        .then(setCompliance)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const filteredCompliance = compliance.filter(
    (c) => selectedFramework === "ALL" || (c.framework || "").toUpperCase() === selectedFramework.toUpperCase()
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Cryptographic Standard & Regulatory Governance
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Compliance Assessment Matrix
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Mapping cryptographic findings against NIST SP 800-131A Rev 2, FIPS 140-3, and NSA CNSA 2.0 standards.
          </p>
        </div>
      </div>

      {/* Framework Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        {["ALL", "NIST SP 800-131A", "FIPS 140-3", "CNSA 2.0"].map((fw) => (
          <button
            key={fw}
            onClick={() => setSelectedFramework(fw)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              selectedFramework === fw
                ? "bg-white text-zinc-950 border-white font-bold"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {fw}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Framework</th>
                <th className="p-4">Control / Requirement</th>
                <th className="p-4">Status</th>
                <th className="p-4">Evidence / Evaluation</th>
                <th className="p-4">Remediation Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredCompliance.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white whitespace-nowrap">
                    {c.framework}
                  </td>
                  <td className="p-4 text-zinc-200">
                    <div className="font-semibold">{c.requirement_name || c.requirement_id}</div>
                    <div className="text-[10px] text-zinc-500">{c.requirement_id}</div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        c.status === "COMPLIANT"
                          ? "solid"
                          : c.status === "NON_COMPLIANT"
                          ? "critical"
                          : "medium"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-zinc-400 max-w-sm leading-relaxed">
                    {c.explanation || c.evidence || "Evaluated against cryptographic primitives."}
                  </td>
                  <td className="p-4 text-zinc-300 max-w-sm leading-relaxed">
                    {c.remediation || "Upgrade to approved post-quantum standard."}
                  </td>
                </tr>
              ))}

              {filteredCompliance.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500 font-mono text-xs">
                    No compliance findings recorded for the active framework filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
