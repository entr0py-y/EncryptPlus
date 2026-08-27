"use client";

import React, { useState } from "react";
import { Copy, Check, FileCode, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEvidenceProps {
  filePath?: string | null;
  lineNumber?: number | null;
  column?: number | null;
  matchText?: string | null;
  contextText?: string | null;
  sourceContextJson?: string | null;
  className?: string;
}

export function CodeEvidence({
  filePath,
  lineNumber,
  column,
  matchText,
  contextText,
  sourceContextJson,
  className,
}: CodeEvidenceProps) {
  const [copied, setCopied] = useState(false);

  let lines: { num: number; text: string; isMatch: boolean }[] = [];

  if (sourceContextJson) {
    try {
      const parsed = JSON.parse(sourceContextJson);
      if (parsed.lines && Array.isArray(parsed.lines)) {
        const start = parsed.startLine || (lineNumber ? lineNumber - 2 : 1);
        lines = parsed.lines.map((lineStr: string, idx: number) => {
          const currentNum = start + idx;
          return {
            num: currentNum,
            text: lineStr,
            isMatch: currentNum === (parsed.matchLine || lineNumber),
          };
        });
      }
    } catch (e) {
      // fallback
    }
  }

  if (lines.length === 0) {
    const rawSnippet = contextText || matchText || "// No source context available";
    const baseLine = lineNumber || 1;
    lines = rawSnippet.split("\n").map((lineStr, idx) => ({
      num: baseLine + idx,
      text: lineStr,
      isMatch: idx === 0,
    }));
  }

  const handleCopy = () => {
    const fullSnippet = lines.map((l) => `${l.num}: ${l.text}`).join("\n");
    navigator.clipboard.writeText(fullSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden", className)}>
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300 truncate">
          <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{filePath || "unknown_source_file"}</span>
          {lineNumber && (
            <span className="text-zinc-500 font-semibold shrink-0">
              :{lineNumber}{column ? `:${column}` : ""}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 hover:border-zinc-500 transition-colors shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Snippet Box */}
      <div className="p-3 overflow-x-auto text-xs font-mono leading-relaxed select-text">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-4 px-2 py-0.5 rounded transition-colors",
              l.isMatch ? "bg-white/10 border-l-2 border-white text-white font-medium" : "text-zinc-400 hover:bg-zinc-900/40"
            )}
          >
            <span className="w-8 text-right text-zinc-600 select-none shrink-0 font-mono text-[11px]">
              {l.num}
            </span>
            <span className="whitespace-pre flex-1">
              {l.isMatch && matchText && l.text.includes(matchText) ? (
                <span>
                  {l.text.substring(0, l.text.indexOf(matchText))}
                  <span className="bg-white text-zinc-950 px-1 py-0.2 rounded font-bold">
                    {matchText}
                  </span>
                  {l.text.substring(l.text.indexOf(matchText) + matchText.length)}
                </span>
              ) : (
                l.text
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
