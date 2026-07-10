"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function WelcomeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8"
    >
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-600/20 p-3">
          <Sparkles className="h-7 w-7 text-cyan-400" />
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">
            ADMIN DASHBOARD
          </p>

          <h1 className="mt-2 text-5xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Monitor executives, leads and business performance from one
            beautiful dashboard.
          </p>
        </div>
      </div>
    </motion.div>
  );
}