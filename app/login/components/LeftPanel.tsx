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

      <div className="space-y-5">

        <FeatureCard
          icon={BarChart3}
          title="Live Analytics"
          description="Monitor executive performance and sales insights in real time."
          color="bg-blue-500/20 text-blue-400"
        />

        <FeatureCard
          icon={ShieldCheck}
          title="Enterprise Security"
          description="Role-based authentication with enterprise-grade protection."
          color="bg-emerald-500/20 text-emerald-400"
        />

        <FeatureCard
          icon={Cpu}
          title="AI Automation"
          description="Automated lead routing, follow-ups and CRM workflows."
          color="bg-violet-500/20 text-violet-400"
        />

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