"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createScan } from "@/lib/api";
import { Check, Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    // Allow standard github URLs, git URLs, or local repository names
    return (
      trimmed.startsWith("https://github.com/") ||
      trimmed.startsWith("http://github.com/") ||
      trimmed.startsWith("git@github.com:") ||
      trimmed.includes("/") ||
      trimmed === "demo_repo"
    );
  };

  const isValid = validateUrl(repoUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setErrorMsg("Enter a valid GitHub repository URL.");
      return;
    }

    if (!validateUrl(trimmed)) {
      setErrorMsg("Enter a valid GitHub repository URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createScan(trimmed);
      if (res?.scan_id) {
        router.push(`/scans/${res.scan_id}`);
      } else {
        setErrorMsg("Failed to start scan. Please verify repository URL.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to start scan. Please verify repository URL.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Minimal Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-mono font-bold text-xs">
            E+
          </div>
          <span className="text-sm font-bold font-mono tracking-tight text-white">
            ENCRYPT PLUS
          </span>
        </div>

        <nav className="flex items-center gap-5 text-xs font-mono text-zinc-500">
          <Link
            href="/scans"
            className="hover:text-zinc-200 transition-colors"
          >
            Past Audits
          </Link>
          <a
            href="https://github.com/entr0py-y/EncryptPlus"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-200 transition-colors"
          >
            Documentation
          </a>
        </nav>
      </header>

      {/* Main Centered Hero Viewport */}
      <main className="w-full max-w-2xl mx-auto my-auto flex flex-col items-center text-center space-y-8 py-12">
        {/* Brand & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-mono">
            ENCRYPT PLUS
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-md mx-auto">
            Enterprise Cryptographic Discovery & Analysis Tool
          </p>
        </div>

        {/* Primary Repository Input & Action */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative w-full">
            {/* GitHub SVG Icon Inside Input */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <svg
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>

            <input
              type="text"
              placeholder="https://github.com/organization/repository"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              disabled={isSubmitting}
              className="w-full h-14 pl-12 pr-12 rounded-2xl border border-zinc-800 bg-[#121214] text-sm sm:text-base font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all shadow-lg"
              autoFocus
            />

            {/* Validation Indicator */}
            {isValid && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Grayscale Validation Error Message */}
          {errorMsg && (
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 py-2 px-3 rounded-xl inline-block">
              {errorMsg}
            </div>
          )}

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting || !repoUrl.trim()}
            className="w-full h-13 py-3.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.99] font-mono font-bold text-sm tracking-wide transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SCANNING…</span>
              </>
            ) : (
              <span>SCAN REPOSITORY</span>
            )}
          </button>
        </form>

        {/* Supporting Quiet Text */}
        <p className="text-xs font-mono text-zinc-500 max-w-sm leading-relaxed">
          Discover cryptographic assets, assess quantum risk, and plan migration.
        </p>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-[11px] font-mono text-zinc-600 py-2">
        ENCRYPT PLUS • Enterprise Cryptographic Discovery & Analysis
      </footer>
    </div>
  );
}
