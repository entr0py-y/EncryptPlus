"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

export default function MoscaPage() {
  const { id } = useParams();

  // Interactive slider parameters
  const [dataLifetimeX, setDataLifetimeX] = useState<number>(7); // X years
  const [migrationTimeY, setMigrationTimeY] = useState<number>(3); // Y years
  const [crqcHorizonZ, setCrqcHorizonZ] = useState<number>(10); // Z years

  const totalExposure = dataLifetimeX + migrationTimeY;
  const isVulnerable = totalExposure > crqcHorizonZ;
  const exposureDelta = totalExposure - crqcHorizonZ;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Quantum Threat Modeling & Temporal Inequality
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono mt-1">
            Mosca's Inequality Simulator
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Evaluating the mathematical window for Harvest Now, Decrypt Later (HNDL) data exposure: X + Y &gt; Z.
          </p>
        </div>
        <Badge variant={isVulnerable ? "vulnerable" : "safe"} className="font-mono text-xs py-1 px-3">
          {isVulnerable ? "CRITICAL TEMPORAL EXPOSURE" : "TEMPORALLY SECURE"}
        </Badge>
      </div>

      {/* Simulator Hero Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-6 p-8 rounded-3xl border border-zinc-800 bg-[#121215] space-y-6">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
            Adjust Threat & Architecture Parameters
          </div>

          <div className="space-y-6 text-xs font-mono">
            {/* Slider X */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Data Shelf-Life (X)</span>
                <span className="text-white font-bold">{dataLifetimeX} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={dataLifetimeX}
                onChange={(e) => setDataLifetimeX(Number(e.target.value))}
                className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">
                How long proprietary data, health records, or secrets must remain confidential.
              </p>
            </div>

            {/* Slider Y */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Migration & Transition Time (Y)</span>
                <span className="text-white font-bold">{migrationTimeY} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={migrationTimeY}
                onChange={(e) => setMigrationTimeY(Number(e.target.value))}
                className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">
                Time required to re-architect, re-encrypt, and deploy PQC across enterprise nodes.
              </p>
            </div>

            {/* Slider Z */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">CRQC Arrival Horizon (Z)</span>
                <span className="text-white font-bold">~{crqcHorizonZ} Years</span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                value={crqcHorizonZ}
                onChange={(e) => setCrqcHorizonZ(Number(e.target.value))}
                className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">
                Assumed timeframe until an adversary achieves fault-tolerant quantum cryptanalysis.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Equation Evaluation */}
        <div className="lg:col-span-6 p-8 rounded-3xl border border-zinc-800 bg-[#121215] space-y-6">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
            Mathematical Result
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <div className="text-sm text-zinc-500">
              {dataLifetimeX} yrs (X) + {migrationTimeY} yrs (Y) = <strong className="text-white text-base">{totalExposure} Years</strong>
            </div>

            <div className="text-3xl font-bold font-mono text-white">
              {totalExposure} {isVulnerable ? ">" : "≤"} {crqcHorizonZ}
            </div>

            <div className="pt-2">
              {isVulnerable ? (
                <div className="p-3 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase">
                  Data Compromised ({exposureDelta} Years Exposure Deficit)
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs uppercase">
                  Data Secure (Zero Exposure Deficit)
                </div>
              )}
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            <strong className="text-white">Note on Threat Horizon:</strong> Quantum computing arrival timelines are probabilistic intelligence scenarios rather than fixed deterministic dates. National cybersecurity agencies (e.g. NIST, NSA CNSA 2.0, BSI) mandate immediate initiation of migration programs to prevent retrospective decryption of intercepted data.
          </p>
        </div>
      </div>
    </div>
  );
}
