"use client";

import {
  Bell,
  Search,
  UserCircle2,
  Sparkles,
} from "lucide-react";

export default function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#05070F]/90 px-8 backdrop-blur-xl">

      {/* Search */}

      <div className="flex w-[420px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">

        <Search
          size={20}
          className="text-slate-400"
        />

        <input
          placeholder="Search leads, customers..."
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
        />

      </div>

      {/* Right */}

      <div className="flex items-center gap-4">

        <button className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 transition hover:bg-cyan-500/20">

          <Sparkles className="text-cyan-400" />

        </button>

        <button className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/5">

          <Bell />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">

          <UserCircle2
            size={40}
            className="text-cyan-400"
          />

          <div>

            <p className="font-semibold">
              Nehra
            </p>

            <p className="text-xs text-slate-400">
              Super Admin
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}