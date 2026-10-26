"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus, GitBranch, ChevronDown, Bot, LogOut, User as UserIcon } from "lucide-react";
import { fetchScans, createScan, ScanRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AgentDrawer } from "@/components/agent/agent-drawer";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";

export function Topbar() {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id ? Number(params.id) : null;

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showScanDropdown, setShowScanDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { user, logout } = useAuth();

  useEffect(() => {
    fetchScans()
      .then((data) => {
        const sorted = data.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        setScans(sorted);
      })
      .catch(() => setScans([]));

    const handleOpen = () => setShowAgentDrawer(true);
    window.addEventListener("open-agent-drawer", handleOpen);

    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "login" | "signup" }>;
      if (customEvent.detail?.mode) {
        setAuthModalMode(customEvent.detail.mode);
      }
      setShowAuthModal(true);
    };
    window.addEventListener("open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("open-agent-drawer", handleOpen);
      window.removeEventListener("open-auth-modal", handleOpenAuth);
    };
  }, [activeId, user]);

  const activeScan = scans.find((s) => s.id === activeId) || scans[0];

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await createScan(repoInput.trim(), branchInput.trim() || undefined);
      setShowScanModal(false);
      setRepoInput("");
      setBranchInput("");
      if (res?.scan_id) {
        router.push(`/scans/${res.scan_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate scan. Please check the repository path/URL.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-transparent dark:bg-transparent backdrop-blur-[2px] sticky top-0 z-30 px-5 sm:px-8 flex items-center justify-between select-none font-sans transition-colors duration-200">
        {/* Leftmost: Auth Controls / User Profile (replaced logo) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setShowAuthModal(true);
                }}
                className="h-9 px-3.5 flex items-center text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("signup");
                  setShowAuthModal(true);
                }}
                className="h-9 px-3.5 flex items-center text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-9 flex items-center gap-2 pl-2 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all text-xs"
                title={user.email}
              >
                <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-[11px] font-mono">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 hidden sm:inline-block max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
              </button>

              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-800 hidden sm:block" />

          {/* Active Scan & Repository Context Pill */}
          <div className="relative">
            <button
              onClick={() => setShowScanDropdown(!showScanDropdown)}
              className="h-9 flex items-center gap-2 px-3 sm:px-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/60 bg-transparent dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs font-mono text-zinc-700 dark:text-zinc-200"
            >
              <GitBranch className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
              <span className="font-semibold text-zinc-900 dark:text-white max-w-[140px] sm:max-w-[200px] truncate font-mono">
                {activeScan?.repository_url ? activeScan.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, "") : "Select Target"}
              </span>
              {activeScan && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  #{activeScan.id}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 ml-0.5" />
            </button>

            {/* Scan Switcher Dropdown */}
            {showScanDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Available Repository Scans
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {scans.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setShowScanDropdown(false);
                        router.push(`/scans/${s.id}`);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors",
                        s.id === activeId 
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold" 
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <div className="truncate max-w-[180px]">
                        <div className="truncate text-zinc-900 dark:text-zinc-200 font-medium font-mono">
                          {s.repository_url ? s.repository_url.split("/").pop() : "Local Demo"}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {s.total_findings || 0} findings • {s.status}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                          {s.overall_risk_score !== null && s.overall_risk_score !== undefined ? `${Number(s.overall_risk_score).toFixed(1)}` : "—"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rightmost: Past Audits, Documentation, Theme Toggle, New Scan, User Profile / Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/scans"
            className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-medium hidden md:inline-block"
          >
            Past Audits
          </Link>
          <a
            href="https://github.com/entr0py-y/EncryptPlus"
            target="_blank"
            rel="noreferrer"
            className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-medium hidden md:inline-block"
          >
            Documentation
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgentDrawer(true)}
            className="h-9 px-3.5 gap-2 shadow-sm text-xs font-medium border-zinc-200/80 dark:border-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-600 bg-transparent dark:bg-zinc-900/20 text-zinc-900 dark:text-zinc-100"
          >
            <Bot className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span>AI Agent</span>
          </Button>

          <ThemeToggle className="h-9 w-9 p-0" />

          <Button
            onClick={() => setShowScanModal(true)}
            size="sm"
            className="h-9 px-4 gap-2 text-xs font-semibold shadow-sm btn-yellow-hover"
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </Button>

        </div>
      </header>


      {/* New Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md animate-in fade-in font-sans p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-2xl space-y-6 text-zinc-900 dark:text-white">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Discovery Engine
              </div>
              <h3 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                Scan Repository
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Initiate cryptographic discovery and post-quantum assessment.
              </p>
            </div>

            <form onSubmit={handleStartScan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-700 dark:text-zinc-300">
                  Target Repository URL or Local Directory
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/org/repo.git or demo_repo"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-700 dark:text-zinc-300">
                  Git Branch (Optional)
                </label>
                <input
                  type="text"
                  placeholder="main or master"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowScanModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !repoInput.trim()}
                  className="text-xs font-medium btn-yellow-hover"
                >
                  {submitting ? "Initiating..." : "Execute Scan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal (blurred background + tile on homescreen) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* AI Assistant Drawer */}
      <AgentDrawer
        isOpen={showAgentDrawer}
        onClose={() => setShowAgentDrawer(false)}
      />
    </>
  );
}
