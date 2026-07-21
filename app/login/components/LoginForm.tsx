"use client";

import { useState, useRef } from "react";
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
const cardRef = useRef<HTMLDivElement>(null);

const [mousePosition, setMousePosition] = useState({
  x: 50,
  y: 50,
});
const [rotation, setRotation] = useState({
  rotateX: 0,
  rotateY: 0,
});
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        mode: "same-origin",
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
        data.user?.role === "EXECUTIVE"
          ? "/executive/dashboard"
          : data.user?.role === "HR"
          ? "/admin/hr"
          : "/admin/dashboard"
      );
    } catch {
      setError("Unable to connect to server.");
      setLoading(false);
    }
  }

function handleMouseMove(
  e: React.MouseEvent<HTMLDivElement>
) {
  if (!cardRef.current) return;

  const rect = cardRef.current.getBoundingClientRect();

  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  setMousePosition({ x, y });

  const rotateY = ((x - 50) / 50) * 6;
  const rotateX = -((y - 50) / 50) * 6;

  setRotation({
    rotateX,
    rotateY,
  });
}
function handleMouseLeave() {
  setRotation({
    rotateX: 0,
    rotateY: 0,
  });

  setMousePosition({
    x: 50,
    y: 50,
  });
}

  return (
    <div className="flex flex-1 items-center justify-center p-8 lg:p-16">

      <motion.div
  ref={cardRef}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  initial={{
    opacity: 0,
    scale: 0.96,
    y: 40,
  }}
  animate={{
    opacity: 1,
    scale: 1,
    y: [0, -8, 0],
  }}
  transition={{
    opacity: { duration: 0.8 },
    scale: { duration: 0.8 },
    y: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }}
  className="
relative
w-full
max-w-lg
overflow-hidden
rounded-[40px]
border
border-white/15
bg-white/[0.06]
backdrop-blur-[45px]
shadow-[0_60px_180px_rgba(0,0,0,.80)]
"
>
<div
  className="pointer-events-none absolute inset-0 transition-all duration-200"
  style={{
    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
      rgba(255,255,255,0.12),
      transparent 45%)`,
  }}
/>
        {/* Animated Glass Glow */}

<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

{/* Moving Reflection */}

<motion.div
  animate={{
    x: ["-150%", "220%"],
  }}
  transition={{
    duration: 6,
    repeat: Infinity,
    ease: "linear",
  }}
  className="
pointer-events-none
absolute
top-0
left-0
h-full
w-28
rotate-12
bg-gradient-to-r
from-transparent
via-white/15
to-transparent
blur-xl
"
/>

{/* Premium Border */}

<div
  className="
pointer-events-none
absolute
inset-0
rounded-[40px]
border
border-white/5
"
/>
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
              
               <motion.label
  initial={{ y: 0 }}
  animate={{
    y: username ? -2 : 0,
    color: username ? "#22d3ee" : "#94a3b8",
  }}
  transition={{ duration: 0.2 }}
  className="mb-3 block text-sm font-medium"
>
  Username
</motion.label>              

              <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-5 transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-lg focus-within:shadow-cyan-500/20">

                <motion.div
  animate={{
    scale: username ? 1.08 : 1,
  }}
  transition={{ duration: 0.2 }}
>
  <User className="mr-4 h-5 w-5 text-cyan-400" />
</motion.div>



                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="
w-full
!bg-transparent
appearance-none
border-0
shadow-none
py-4
text-white
outline-none
placeholder:text-slate-500
placeholder:transition-all
placeholder:duration-300
focus:placeholder:text-slate-700
"
                />

              </div>
            </div>

            {/* Password */}

            <div>
              
<motion.label
  initial={{ y: 0 }}
  animate={{
    y: password ? -2 : 0,
    color: password ? "#22d3ee" : "#94a3b8",
  }}
  transition={{ duration: 0.2 }}
  className="mb-3 block text-sm font-medium"
>
  Password
</motion.label>

<div
  className="
group
flex
items-center
rounded-2xl
border
border-white/10
bg-slate-900/60
px-5
transition-all
duration-300
focus-within:border-cyan-400
focus-within:shadow-lg
focus-within:shadow-cyan-500/20
"
>

  <motion.div
    animate={{
      scale: password ? 1.08 : 1,
    }}
    transition={{ duration: 0.2 }}
  >
    <Lock className="mr-4 h-5 w-5 text-cyan-400" />
  </motion.div>

  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Enter your password"
    className="
w-full
bg-transparent
py-4
text-white
outline-none
placeholder:text-slate-500
"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="ml-4 bg-transparent p-0 border-0 shadow-none text-slate-400 hover:text-white"
  >
    {showPassword ? (
      <EyeOff size={22} />
    ) : (
      <Eye size={22} />
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
                className="bg-transparent p-0 border-0 shadow-none text-sm text-cyan-400 transition hover:text-cyan-300 hover:underline"
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
  whileHover={{
    scale: 1.02,
    boxShadow: "0 20px 50px rgba(6,182,212,.45)",
  }}
  whileTap={{
    scale: 0.98,
  }}
  className="
group
relative
overflow-hidden
flex
w-full
items-center
justify-center
gap-3
rounded-2xl
bg-gradient-to-r
from-cyan-500
via-blue-600
to-indigo-600
py-4
text-lg
font-semibold
text-white
shadow-[0_20px_60px_rgba(6,182,212,.35)]
transition-all
duration-300
disabled:cursor-not-allowed
disabled:opacity-60
"
>
  {/* Animated Shine */}

  <motion.div
    animate={{
      x: ["-150%", "250%"],
    }}
    transition={{
      duration: 2.5,
      repeat: Infinity,
      ease: "linear",
    }}
    className="
absolute
left-0
top-0
h-full
w-20
rotate-12
bg-gradient-to-r
from-transparent
via-white/25
to-transparent
"
  />

  {loading ? (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
      />

      Accessing...
    </>
  ) : (
    <>
      Access Workspace

      <ArrowRight
        size={20}
        className="transition-transform duration-300 group-hover:translate-x-2"
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