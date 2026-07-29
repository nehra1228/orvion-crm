"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.1),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.12),transparent_16%),linear-gradient(180deg,#020615_0%,#040b17_100%)]">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <Navbar />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8 xl:px-9">{children}</main>
      </div>
    </div>
  );
}
