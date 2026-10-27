"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/shared/logo";
import { CursorGrid } from "@/components/animations/CursorGrid";
import { useTheme } from "@/components/shared/theme-provider";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/", "/scans", "/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/scans");

  useEffect(() => {
    // If on a protected route and finished checking auth, redirect unauthenticated users
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, isPublicRoute, router]);

  // Determine what view to show based on auth state
  let content: React.ReactNode;

  if (isAuthPage) {
    content = <main className="min-h-screen flex flex-col">{children}</main>;
  } else if (loading) {
    content = (
      <div className="min-h-screen flex flex-col items-center justify-center text-black dark:text-white font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <Logo className="w-10 h-10 text-black dark:text-white animate-pulse" />
          <div className="flex items-center gap-2 text-xs font-mono text-black dark:text-white">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
            <span>Verifying session security...</span>
          </div>
        </div>
      </div>
    );
  } else if (!user && !isPublicRoute) {
    content = (
      <div className="min-h-screen flex flex-col items-center justify-center text-black dark:text-white font-sans select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-black dark:text-white">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
          <span>Redirecting to authentication...</span>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="min-h-screen flex flex-col text-black dark:text-white transition-colors duration-200">
        <Topbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-white dark:bg-[#0B0D10] text-black dark:text-white transition-colors duration-200">
      {/* Background CursorGrid across whole site */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <CursorGrid
          key={theme}
          cellSize={50}
          color={isLight ? "#d97706" : "#eab308"}
          gridColor={isLight ? "#18181b" : "#ffffff"}
          highlight="area"
          gridStyle="lines"
          falloff="smooth"
          radius={90}
          holdTime={400}
          fadeDuration={800}
          lineWidth={0.8}
          maxOpacity={isLight ? 0.7 : 1}
          fillOpacity={isLight ? 0.08 : 0.06}
          gridOpacity={isLight ? 0.05 : 0.08}
          spotlight={isLight ? 0.4 : 0.6}
          cellGap={0}
          cellRadius={0}
          pulseSpeed={600}
          ambient={0}
          edgeFade={0.2}
          clickPulse={true}
          intro={false}
          lightMode={isLight}
        />
      </div>

      {/* Foreground content with interactive elements */}
      <div className="relative z-10 w-full min-h-screen">
        {content}
      </div>
    </div>
  );
}
