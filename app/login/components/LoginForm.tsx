"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function LoginForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      router.push(
        data.user?.role === "ADMIN"
          ? "/admin/dashboard"
          : "/executive/dashboard"
      );
    } catch {
      setError("Unable to connect to server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8 lg:p-16">

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.05] backdrop-blur-3xl shadow-[0_35px_100px_rgba(0,0,0,.6)]"
      >

        {/* Background Glow */}

        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-yellow-500/5" />

        {/* Glass Reflection */}

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 p-10">

          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">
            Welcome Back
          </p>

          <h2 className="mt-3 text-5xl font-black">
            Sign In
          </h2>

          <p className="mt-3 text-slate-400">
            Continue to your ORVION workspace.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6"
          >
                        {/* Username */}

            <div>
              <label className="mb-3 block text-sm text-slate-400">
                Username
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-5 transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/20">

                <User className="mr-4 h-5 w-5 text-slate-500" />

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-transparent py-4 text-white outline-none placeholder:text-slate-500"
                />

              </div>
            </div>

            {/* Password */}

            <div>
              <label className="mb-3 block text-sm text-slate-400">
                Password
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-5 transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/20">

                <Lock className="mr-4 h-5 w-5 text-slate-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent py-4 text-white outline-none placeholder:text-slate-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>
            </div>

            {/* Remember */}

            <div className="flex items-center justify-between">

              <label className="flex items-center gap-3 text-sm text-slate-400">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                />

                Remember me

              </label>

              <button
                type="button"
                className="text-sm text-cyan-400 transition hover:text-cyan-300"
              >
                Forgot Password?
              </button>

            </div>

            {/* Error */}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
                                    {/* Sign In Button */}

                        <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing In..." : (
                <>
                  <span>Sign In</span>
                  <ArrowRight
                    size={20}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
                        {/* Footer */}

            <div className="pt-6 text-center">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} ORVION GROUP
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Enterprise CRM Suite
              </p>
            </div>

          </form>

        </div>

      </motion.div>

    </div>
  );
}