"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/", "/scans", "/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/scans");

  useEffect(() => {
    // If on a protected route and finished checking auth, redirect unauthenticated users
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, isPublicRoute, router]);

  // Auth pages (login, signup) render directly without the app shell topbar
  if (isAuthPage) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  // Prevent flashing protected content before session verification completes
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <Logo className="w-10 h-10 text-zinc-950 dark:text-white animate-pulse" />
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying session security...</span>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated and on protected route, show redirecting state
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Redirecting to authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] transition-colors duration-200">
      <Topbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
