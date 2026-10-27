"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ShieldCheck, Lock, Cookie, ExternalLink } from "lucide-react";

type ModalType = "terms" | "privacy" | "security" | "cookies" | null;

export function Footer() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/60 bg-white dark:bg-transparent backdrop-blur-[2px] py-6 px-4 sm:px-8 mt-auto select-none font-sans text-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-7 gap-y-3 text-zinc-500 dark:text-zinc-400">
          {/* Copyright */}
          <Link
            href="/"
            className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-400 dark:hover:text-yellow-300 transition-colors font-mono text-xs inline-flex items-center gap-1.5 font-medium"
          >
            <span className="text-[17px] font-sans font-normal leading-none inline-block">©</span>
            <span>{currentYear} EncryptPlus, Inc.</span>
          </Link>

          {/* Links matching GitHub dock style */}
          <button
            type="button"
            onClick={() => setActiveModal("terms")}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            Terms
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("privacy")}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            Privacy
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("security")}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            Security
          </button>

          <a
            href="https://github.com/entr0py-y/EncryptPlus/discussions"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Community
          </a>

          <a
            href="https://github.com/entr0py-y/EncryptPlus#readme"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Docs
          </a>

          <a
            href="https://github.com/entr0py-y/EncryptPlus/issues"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Contact
          </a>

          <button
            type="button"
            onClick={() => setActiveModal("cookies")}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            Manage cookies
          </button>
        </div>
      </footer>

      {/* Interactive Modal for Footer Links */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {activeModal === "terms" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Terms of Service</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                  EncryptPlus provides open-source and enterprise cryptographic asset discovery, AST-driven algorithm inventory, and post-quantum readiness assessment.
                </p>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-1">
                  <div>• Scanning runs locally or in isolated sandboxed workers.</div>
                  <div>• No source code or proprietary intellectual property is retained.</div>
                  <div>• Reports adhere to deterministic verification standards.</div>
                </div>
              </div>
            )}

            {activeModal === "privacy" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Privacy Policy</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                  Your privacy and intellectual property integrity are fundamental to our architecture:
                </p>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-1">
                  <div>• Zero code retention after AST parsing and CBOM generation.</div>
                  <div>• All findings metadata are cryptographically hashed and isolated per tenant.</div>
                  <div>• Telemetry is strictly opt-in and stripped of proprietary identifiers.</div>
                </div>
              </div>
            )}

            {activeModal === "security" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Security Posture</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                  Post-quantum security intelligence aligning with international standards:
                </p>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-1">
                  <div>• NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA).</div>
                  <div>• Mosca Theorem and quantum vulnerability timeline tracking.</div>
                  <div>• Constant-time verification & robust cryptographic asset discovery.</div>
                </div>
              </div>
            )}

            {activeModal === "cookies" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Cookie Preferences</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                  EncryptPlus exclusively employs strictly necessary security tokens:
                </p>
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white">Session Authentication</div>
                      <div className="text-[10px] text-zinc-500">JWT and CSRF protection tokens</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white">Theme Preference</div>
                      <div className="text-[10px] text-zinc-500">Remembers dark/light mode selection</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
