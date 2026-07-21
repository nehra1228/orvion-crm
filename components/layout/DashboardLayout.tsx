"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.12),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,.08),transparent_16%),linear-gradient(180deg,#020617_0%,#05080f_100%)]">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <Navbar />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8 xl:px-9">{children}</main>
      </div>
    </div>
  );
}
