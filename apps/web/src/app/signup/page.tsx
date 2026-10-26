"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Loader2, ArrowRight, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <Logo className="w-6 h-6 text-zinc-950 dark:text-white shrink-0 group-hover:scale-105 transition-all" />
          <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            ENCRYPT PLUS
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Signup Card */}
      <main className="w-full max-w-md mx-auto my-auto px-4 py-8">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white mb-2">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Create Your Account
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Start auditing cryptographic posture and quantum risk
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@organization.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 dark:text-white hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        ENCRYPT PLUS • Enterprise Cryptographic Discovery & Analysis
      </footer>
    </div>
  );
}
