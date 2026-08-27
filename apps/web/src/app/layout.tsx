import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ENCRYPT PLUS — Enterprise Cryptographic Discovery & Analysis Tool",
  description: "Cryptographic Intelligence, Quantum Exposure, and PQC Migration Governance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.className} bg-[#09090b] text-[#f4f4f5] antialiased overflow-x-hidden`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 pb-16">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
