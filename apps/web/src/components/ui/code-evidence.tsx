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
        lines = parsed.lines.map((item: any, idx: number) => {
          let lineNum = start + idx;
          let content = "";
          let isMatch = false;

          if (item && typeof item === "object") {
            lineNum = item.number !== undefined ? item.number : lineNum;
            content = String(item.content !== undefined ? item.content : item.text || "");
            isMatch = !!item.isMatch || lineNum === (parsed.matchLine || lineNumber);
          } else {
            content = String(item || "");
            isMatch = lineNum === (parsed.matchLine || lineNumber);
          }

          return {
            num: lineNum,
            text: content,
            isMatch,
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
    lines = String(rawSnippet)
      .split("\n")
      .map((lineStr, idx) => ({
        num: baseLine + idx,
        text: String(lineStr),
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
    <div className={cn("rounded-xl border border-zinc-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-950/40 backdrop-blur-sm overflow-hidden font-mono", className)}>
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800/70 text-xs">
        <div className="flex items-center gap-2 text-black dark:text-white truncate">
          <FileCode className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          <span className="truncate">{filePath || "unknown_source_file"}</span>
          {lineNumber && (
            <span className="text-yellow-500 font-semibold shrink-0">
              :{lineNumber}{column ? `:${column}` : ""}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700/60 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors shrink-0 font-medium"
        >
          {copied ? <Check className="w-3 h-3 text-yellow-500 dark:text-yellow-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Snippet Box */}
      <div className="p-3 overflow-x-auto text-xs leading-relaxed select-text">
        {lines.map((l, i) => {
          const hasMatch = l.isMatch && matchText && typeof l.text === "string" && l.text.includes(matchText);

          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-4 px-2 py-0.5 rounded transition-colors",
                l.isMatch ? "bg-amber-500/10 dark:bg-yellow-500/10 border-l-2 border-yellow-500 text-black dark:text-white font-semibold" : "text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
              )}
            >
              <span className="w-8 text-right text-black dark:text-white select-none shrink-0 font-mono text-[11px]">
                {l.num}
              </span>
              <span className="whitespace-pre flex-1 font-mono">
                {hasMatch ? (
                  <span>
                    {l.text.substring(0, l.text.indexOf(matchText))}
                    <span className="bg-yellow-500 text-black px-1 py-0.5 rounded font-bold shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                      {matchText}
                    </span>
                    {l.text.substring(l.text.indexOf(matchText) + matchText.length)}
                  </span>
                ) : (
                  l.text
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
