"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Loader2, ArrowRight, UserPlus, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/scans");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      router.push("/scans");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-black dark:text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none font-sans">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <Logo className="w-6 h-6 text-black dark:text-white shrink-0 group-hover:scale-105 transition-all" />
          <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
            ENCRYPT PLUS
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Signup Card */}
      <main className="w-full max-w-md mx-auto my-auto px-4 py-8">
        <div className="bg-[#121214]/90 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/80 text-black dark:text-white mb-2">
              <UserPlus className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
              Create Your Account
            </h1>
            <p className="text-xs text-black dark:text-white">
              Start auditing cryptographic posture and quantum risk
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-yellow-500 dark:text-yellow-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#09090b] text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                disabled={isSubmitting}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#09090b] text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
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
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#09090b] text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
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
                placeholder="Re-type password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#09090b] text-black dark:text-white text-xs font-mono placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-xs text-black dark:text-white">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-yellow-500 dark:text-yellow-400 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] font-mono text-black dark:text-white">
        ENCRYPT PLUS • Enterprise Cryptographic Discovery &amp; Analysis
      </footer>
    </div>
  );
}
