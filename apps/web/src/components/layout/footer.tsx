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
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-7 gap-y-3 text-black dark:text-white">
          {/* Copyright */}
          <Link
            href="/"
            className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors font-mono text-xs inline-flex items-center gap-1.5 font-medium"
          >
            <span className="text-[17px] font-sans font-normal leading-none inline-block">©</span>
            <span>{currentYear} EncryptPlus, Inc.</span>
          </Link>

          {/* Links matching GitHub dock style */}
          <button
            type="button"
            onClick={() => setActiveModal("terms")}
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer"
          >
            Terms
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("privacy")}
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer"
          >
            Privacy
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("security")}
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer"
          >
            Security
          </button>

          <a
            href="https://github.com/entr0py-y/EncryptPlus/discussions"
            target="_blank"
            rel="noreferrer"
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
          >
            Community
          </a>

          <a
            href="https://github.com/entr0py-y/EncryptPlus#readme"
            target="_blank"
            rel="noreferrer"
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
          >
            Docs
          </a>

          <a
            href="https://github.com/entr0py-y/EncryptPlus/issues"
            target="_blank"
            rel="noreferrer"
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
          >
            Contact
          </a>

          <button
            type="button"
            onClick={() => setActiveModal("cookies")}
            className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer"
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
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-2xl space-y-4 text-black dark:text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {activeModal === "terms" && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h3 className="text-base font-bold text-black dark:text-white">Terms of Service</h3>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed font-mono">
                  EncryptPlus provides open-source and enterprise cryptographic asset discovery, AST-driven algorithm inventory, and post-quantum readiness assessment.
                </p>
                <div className="text-xs text-black dark:text-white space-y-1.5 pt-1">
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
                  <h3 className="text-base font-bold text-black dark:text-white">Privacy Policy</h3>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed font-mono">
                  Your privacy and intellectual property integrity are fundamental to our architecture:
                </p>
                <div className="text-xs text-black dark:text-white space-y-1.5 pt-1">
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
                  <h3 className="text-base font-bold text-black dark:text-white">Security Posture</h3>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed font-mono">
                  Post-quantum security intelligence aligning with international standards:
                </p>
                <div className="text-xs text-black dark:text-white space-y-1.5 pt-1">
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
                  <h3 className="text-base font-bold text-black dark:text-white">Cookie Preferences</h3>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed font-mono">
                  EncryptPlus exclusively employs strictly necessary security tokens:
                </p>
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <div className="font-semibold text-black dark:text-white">Session Authentication</div>
                      <div className="text-[10px] text-black dark:text-white">JWT and CSRF protection tokens</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-semibold">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <div className="font-semibold text-black dark:text-white">Theme Preference</div>
                      <div className="text-[10px] text-black dark:text-white">Remembers dark/light mode selection</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 font-semibold">
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
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
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
