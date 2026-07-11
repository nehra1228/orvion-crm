"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  PhoneCall,
  Users,
  TrendingUp,
  Plus,
  Upload,
} from "lucide-react";

interface WelcomeCardProps {
  onCreateLead: () => void;
}

export default function WelcomeCard({
  onCreateLead,
}: WelcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#10172C] via-[#0C1220] to-[#070B14] p-10"
    >
      {/* Glow */}

      <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative z-10">

        {/* Top */}

        <div className="flex items-start justify-between">

          <div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.45em] text-cyan-400">
              ORVION CRM
            </p>

            <h1 className="text-5xl font-black text-white">
              Good Afternoon,
              <span className="text-cyan-400"> Nehra</span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg text-slate-400">
              Welcome back. Here's today's performance across your sales,
              executives and lead pipeline.
            </p>

          </div>

          <div className="rounded-3xl bg-cyan-500/10 p-5">

            <Sparkles
              size={42}
              className="text-cyan-400"
            />

          </div>

        </div>

        {/* Stats */}

        <div className="mt-10 grid grid-cols-4 gap-5">

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">

            <PhoneCall className="mb-4 text-cyan-400" />

            <p className="text-3xl font-bold text-white">
              126
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Calls Today
            </p>

          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">

            <Users className="mb-4 text-green-400" />

            <p className="text-3xl font-bold text-white">
              42
            </p>

            <p className="mt-2 text-sm text-slate-400">
              New Leads
            </p>

          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">

            <TrendingUp className="mb-4 text-yellow-400" />

            <p className="text-3xl font-bold text-white">
              28%
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Conversion
            </p>

          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">

            <Sparkles className="mb-4 text-purple-400" />

            <p className="text-3xl font-bold text-white">
              ₹2.4Cr
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Revenue
            </p>

          </div>

        </div>

                {/* Buttons */}

        <div className="mt-10 flex gap-4">
          <button
            onClick={onCreateLead}
            className="flex items-center gap-3 rounded-2xl bg-cyan-500 px-7 py-4 font-semibold text-slate-950 transition hover:scale-[1.03] hover:bg-cyan-400"
          >
            <Plus size={20} />
            Create Lead
          </button>

          <button
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-4 font-semibold text-white transition hover:bg-white/5"
          >
            <Upload size={20} />
            Upload Excel
          </button>
        </div>

      </div> {/* <-- CLOSES relative z-10 */}

    </motion.div>
  );
}