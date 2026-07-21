"use client";

import { ReactNode } from "react";

export default function ExecutiveLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),transparent_16%),linear-gradient(180deg,#020617_0%,#05080f_100%)]">
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
