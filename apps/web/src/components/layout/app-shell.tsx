"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] transition-colors duration-200">
      <Topbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
