"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already authenticated, redirect to audits
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/scans");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      router.push("/scans");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
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

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto px-4 py-8">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign In to EncryptPlus
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Access your cryptographic inventory, CBOM, and audits
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-zinc-900 dark:text-white hover:underline transition-colors"
            >
              Create Account
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
