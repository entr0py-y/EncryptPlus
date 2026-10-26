"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createScan } from "@/lib/api";
import { Check, Loader2, ArrowRight, Bot } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AgentDrawer } from "@/components/agent/agent-drawer";
import { Logo } from "@/components/shared/logo";

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);


  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return (
      trimmed.startsWith("https://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("git@") ||
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
      setErrorMsg("Please enter a GitHub repository URL or directory path.");
      return;
    }

    if (!validateUrl(trimmed)) {
      setErrorMsg("Enter a valid GitHub URL (e.g., https://github.com/openssl/openssl or demo_repo)");
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
      setErrorMsg("Failed to start scan. Please check that the backend is running and the URL is reachable.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none font-sans transition-colors duration-200">
      {/* Top Header spanning full width to corners */}
      <header className="w-full flex items-center justify-between">
        {/* Leftmost: Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <Logo className="w-6 h-6 text-zinc-950 dark:text-white shrink-0 group-hover:scale-105 transition-all" />
          <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            ENCRYPT PLUS
          </span>
        </Link>

        {/* Rightmost: Navigation & Theme Toggle */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <Link
            href="/scans"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-medium cursor-pointer"
          >
            Past Audits
          </Link>
          <a
            href="https://github.com/entr0py-y/EncryptPlus"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-medium cursor-pointer"
          >
            Documentation
          </a>
          <button
            onClick={() => setShowAgentDrawer(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100 font-medium"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Agent</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Hero Viewport */}
      <main className="w-full max-w-2xl mx-auto my-auto flex flex-col items-center text-center space-y-8 py-12">
        {/* Brand & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
            ENCRYPT PLUS
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Enterprise Cryptographic Discovery & Analysis Tool
          </p>
        </div>

        {/* Primary Repository Input & Action */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative w-full">
            {/* GitHub SVG Icon Inside Input */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center w-5 h-5">
              <svg
                width="20"
                height="20"
                style={{ width: "20px", height: "20px", maxWidth: "20px", maxHeight: "20px" }}
                className="w-5 h-5 fill-current shrink-0"
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

            {/* Monospace Input strictly for the URL string */}
            <input
              type="text"
              placeholder="https://github.com/organization/repository"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              disabled={isSubmitting}
              className="w-full h-14 pl-12 pr-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-sm sm:text-base font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all shadow-md dark:shadow-lg"
              autoFocus
            />

            {/* Validation Indicator */}
            {isValid && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Quick Examples */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span>Try:</span>
            <button
              type="button"
              onClick={() => {
                setRepoUrl("https://github.com/openssl/openssl");
                if (errorMsg) setErrorMsg("");
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              openssl/openssl
            </button>
            <button
              type="button"
              onClick={() => {
                setRepoUrl("demo_repo");
                if (errorMsg) setErrorMsg("");
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              demo_repo
            </button>
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 py-2 px-3 rounded-xl inline-block">
              {errorMsg}
            </div>
          )}

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 py-3.5 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-[0.99] font-medium text-sm tracking-wide transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning…</span>
              </>
            ) : (
              <>
                <span>Scan Repository</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Supporting Quiet Text */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
          Discover cryptographic assets and assess security and post-quantum readiness.
        </p>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full text-center text-[11px] text-zinc-500 dark:text-zinc-600 py-2">
        ENCRYPT PLUS • Enterprise Cryptographic Discovery & Analysis
      </footer>

      {/* AI Assistant Drawer */}
      <AgentDrawer
        isOpen={showAgentDrawer}
        onClose={() => setShowAgentDrawer(false)}
      />
    </div>
  );
}
