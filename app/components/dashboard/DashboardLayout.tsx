"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#05070F] text-white">

      <div className="flex">

        <Sidebar />

        {/* Right Side */}

        <div className="flex min-h-screen flex-1 flex-col">

          <TopNavbar />

          <main className="flex-1 p-8">

            {children}

          </main>

        </div>

      </div>

    </div>
  );
}