import {
  Sparkles,
  ShieldCheck,
  BarChart3,
  Cpu,
} from "lucide-react";

import FeatureCard from "./FeatureCard";

export default function LeftPanel() {
  return (
    <div className="hidden xl:flex w-[46%] flex-col justify-between border-r border-white/10 bg-white/[0.03] backdrop-blur-3xl p-16">

      <div>

        {/* Enterprise Badge */}

        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-5 py-2">

          <Sparkles className="h-5 w-5 text-yellow-400" />

          <span className="text-sm font-medium text-yellow-300">
            Enterprise CRM Suite
          </span>

        </div>

        {/* Logo */}

        <h1 className="mt-12 text-8xl font-black leading-none tracking-tight">

          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ORVION
          </span>

        </h1>

        <h2 className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-7xl font-black text-transparent">
          GROUP
        </h2>

        <p className="mt-8 max-w-xl text-lg leading-9 text-slate-400">

          AI Powered Enterprise CRM engineered for intelligent
          lead management, automation, executive monitoring,
          sales analytics and business growth.

        </p>

      </div>

      {/* Feature Cards */}

      <div className="mt-16 space-y-5">

  {/* System Status */}

  <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">

    <div className="flex items-center gap-3">

      <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

      <span className="text-sm font-medium">
        System Status
      </span>

    </div>

    <span className="text-emerald-300 font-semibold">
      ONLINE
    </span>

  </div>

  {/* Stats */}

  <div className="grid grid-cols-2 gap-4">

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <p className="text-3xl font-black text-cyan-400">
        8,452
      </p>

      <p className="mt-2 text-sm text-slate-400">
        Active Leads
      </p>

    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <p className="text-3xl font-black text-yellow-400">
        ₹428Cr
      </p>

      <p className="mt-2 text-sm text-slate-400">
        Pipeline
      </p>

    </div>

  </div>

  {/* Uptime */}

  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

    <div className="flex items-center justify-between">

      <span className="text-slate-400">
        System Uptime
      </span>

      <span className="text-cyan-400 font-bold">
        99.98%
      </span>

    </div>

    <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">

      <div className="h-full w-[99%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />

    </div>

  </div>

</div>

      {/* Footer */}

      <div>

        <div className="flex items-center justify-between border-t border-white/10 pt-8">

          <div>

            <p className="text-sm text-slate-500">
              © 2026 ORVION GROUP
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Enterprise CRM Platform
            </p>

          </div>

          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">

            <span className="text-xs font-semibold text-emerald-400">
              SYSTEM ONLINE
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}