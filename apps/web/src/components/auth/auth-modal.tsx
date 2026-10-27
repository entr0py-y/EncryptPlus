"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import {
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  Lock,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}: AuthModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes("Invalid email") || err.message?.includes("401")
          ? "Invalid email or password. If you haven't created an account yet on this deployment, switch to 'Create Account' above, or click Demo Login below."
          : err.message || "Invalid email or password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*(),.?":{}|<>\-_]/.test(password)) {
      setErrorMsg("Password must contain at least one letter and one number or symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(trimmedName, trimmedEmail, password, confirmPassword);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-150 text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl mb-6 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-semibold"
                : "text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-semibold"
                : "text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-black dark:text-white mb-1 shadow-sm">
            {mode === "login" ? (
              <ShieldCheck className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white font-mono">
            {mode === "login" ? "Sign In to EncryptPlus" : "Create Your Account"}
          </h2>
          <p className="text-xs text-black dark:text-white">
            {mode === "login"
              ? "Access your cryptographic inventory, CBOM, and audits"
              : "Start auditing cryptographic posture and quantum risk"}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-yellow-500 dark:text-yellow-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-black dark:text-white">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                }}
                className="font-semibold text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline cursor-pointer"
              >
                Create one now
              </button>
            </div>

            {/* Quick Demo Access */}
            <div className="mt-4 pt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-yellow-500 dark:text-yellow-400">
                    Demo Credentials
                  </span>
                  <span className="font-mono text-[10px] text-black dark:text-white">
                    Instant Access
                  </span>
                </div>
                <div className="font-mono text-[11px] text-black dark:text-white flex flex-col gap-0.5">
                  <div>Email: <span className="text-black dark:text-white font-semibold">demo@encryptplus.com</span></div>
                  <div>Password: <span className="text-black dark:text-white font-semibold">EncryptPlus2026!</span></div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setEmail("demo@encryptplus.com");
                    setPassword("EncryptPlus2026!");
                    setIsSubmitting(true);
                    setErrorMsg("");
                    try {
                      await login("demo@encryptplus.com", "EncryptPlus2026!");
                      onClose();
                      onSuccess?.();
                    } catch (err: any) {
                      setErrorMsg(err.message || "Demo login failed");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="mt-1 w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>1-Click Sign In as Demo User</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@organization.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-black dark:text-white mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-black dark:text-white">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className="font-semibold text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline cursor-pointer"
              >
                Sign in instead
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
