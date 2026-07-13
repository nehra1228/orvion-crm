"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, BarChart3, Bot, BrainCircuit, CheckCircle2, ChevronRight, Eye,
  EyeOff, KeyRound, LockKeyhole, PhoneCall, ShieldCheck, Sparkles, UserRound,
  UsersRound, WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  { title: "Lead Management", detail: "Turn every enquiry into momentum.", icon: UsersRound, accent: "from-blue-500/30 to-cyan-400/5", color: "text-cyan-200", position: "left-[5%] top-[25%]" },
  { title: "AI Sales Assistant", detail: "Focused intelligence for every rep.", icon: BrainCircuit, accent: "from-violet-500/30 to-blue-400/5", color: "text-violet-200", position: "left-[20%] bottom-[12%]" },
  { title: "Live Analytics", detail: "Clarity across the entire pipeline.", icon: BarChart3, accent: "from-cyan-500/30 to-blue-400/5", color: "text-cyan-200", position: "right-[9%] top-[20%]" },
  { title: "Automation", detail: "The right actions, always on time.", icon: WandSparkles, accent: "from-blue-500/30 to-indigo-400/5", color: "text-blue-200", position: "right-[12%] bottom-[9%]" },
  { title: "Call Tracking", detail: "Every conversation, in context.", icon: PhoneCall, accent: "from-sky-500/25 to-cyan-300/5", color: "text-sky-200", position: "left-[44%] top-[48%]" },
  { title: "Executive Command", detail: "A sharper view of team performance.", icon: Bot, accent: "from-indigo-500/25 to-violet-300/5", color: "text-indigo-200", position: "right-[37%] top-[59%]" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const remembered = window.localStorage.getItem("orvion-login-username");
    if (remembered) setUsername(remembered);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      if (remember) window.localStorage.setItem("orvion-login-username", username);
      else window.localStorage.removeItem("orvion-login-username");
      const destination = data.user?.role === "ADMIN" ? "/admin/dashboard" : "/executive/dashboard";
      router.push(destination);
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030817] text-white selection:bg-cyan-300/30">
      <Background reduceMotion={Boolean(reduceMotion)} />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1920px]">
        <section className="relative hidden min-h-screen w-[60%] overflow-hidden border-r border-white/[0.08] xl:block">
          <div className="relative z-10 flex h-full min-h-screen flex-col justify-between px-[8%] py-10 2xl:px-[11%]">
            <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.08)]">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-200" /></span>
                Enterprise CRM Suite
              </div>
              <div className="mt-16 max-w-3xl 2xl:mt-24">
                <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300"><Sparkles className="h-3.5 w-3.5" />The operating system for growth</p>
                <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white 2xl:text-7xl">Welcome to<br /><span className="bg-gradient-to-r from-blue-200 via-cyan-100 to-cyan-300 bg-clip-text text-transparent">ORVION CRM.</span></h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 2xl:text-lg 2xl:leading-8">The intelligent CRM built for high-performing sales teams. Bring every lead, conversation and decision into one focused command center.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="flex items-end justify-between">
              <div className="flex -space-x-2"><Avatar letter="A" /><Avatar letter="R" /><Avatar letter="S" /><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#071225] bg-slate-700 text-[10px] font-semibold text-slate-200">+99</span></div>
              <p className="max-w-56 text-right text-xs leading-5 text-slate-500">Built for teams that treat every customer interaction like it matters.</p>
            </motion.div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">{features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} reduced={Boolean(reduceMotion)} />)}</div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-[#030817] via-[#030817]/65 to-transparent" />
        </section>

        <section className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-8 sm:px-8 xl:w-[40%] xl:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(34,211,238,.12),transparent_27%),radial-gradient(circle_at_18%_78%,rgba(37,99,235,.14),transparent_32%)]" />
          <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-[440px]">
            <div className="absolute -inset-px rounded-[33px] bg-gradient-to-br from-cyan-200/35 via-blue-400/10 to-transparent opacity-80 blur-[1px]" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.12] bg-slate-950/55 p-6 shadow-[0_32px_100px_rgba(0,0,0,.5),0_0_80px_rgba(6,182,212,.06)] backdrop-blur-2xl sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.09),transparent_30%,transparent_65%,rgba(34,211,238,.045))]" />
              <div className="relative">
                <div className="flex items-center justify-between"><Logo /><span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-400">Secure sign in</span></div>
                <div className="mt-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">ORVION GROUP</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-400">Sign in to access your workspace and keep your pipeline moving.</p></div>
                <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
                  <div><label htmlFor="username" className="mb-2 block text-xs font-semibold text-slate-300">Username</label><div className="group relative"><UserRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" /><input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required aria-invalid={Boolean(error)} className="h-10 w-full rounded-xl border border-white/[0.1] bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-400/[0.08]" placeholder="Enter your username" /></div></div>
                  <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</label><a href="#forgot-password" onClick={(event) => { event.preventDefault(); setError("Please contact your ORVION administrator to reset your password."); }} className="text-xs font-medium text-cyan-300 transition hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40">Forgot password?</a></div><div className="group relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500 transition group-focus-within:text-cyan-300" /><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required aria-invalid={Boolean(error)} className="h-10 w-full rounded-xl border border-white/[0.1] bg-slate-950/70 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-400/[0.08]" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/40">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                  <label className="flex cursor-pointer items-center gap-2.5 pt-0.5 text-xs text-slate-400"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="peer sr-only" /><span className="flex h-4 w-4 items-center justify-center rounded border border-white/15 bg-slate-900 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-400"><CheckCircle2 className="h-3.5 w-3.5 text-slate-950 opacity-0 transition peer-checked:opacity-100" /></span>Remember me on this device</label>
                  {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.09] px-3 py-2.5 text-xs leading-5 text-rose-200"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}</motion.div>}
                  <motion.button whileHover={reduceMotion ? undefined : { scale: 1.01 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }} disabled={loading} className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 px-4 text-sm font-bold text-slate-950 shadow-[0_12px_30px_rgba(6,182,212,.2)] transition focus:outline-none focus:ring-4 focus:ring-cyan-300/25 disabled:cursor-wait disabled:opacity-75"><span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-full" />{loading ? <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />Signing in securely…</> : <>Sign in to ORVION <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</motion.button>
                </form>
                <div className="mt-6 flex items-center gap-2 border-t border-white/[0.07] pt-5 text-[11px] leading-4 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />Your connection is protected with enterprise-grade security.</div>
              </div>
            </div>
          </motion.div>
          <footer className="absolute bottom-5 left-4 right-4 flex items-center justify-center gap-2 text-center text-[10px] text-slate-600 sm:bottom-6"><span>ORVION CRM v1.0</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>© {new Date().getFullYear()} ORVION GROUP</span></footer>
        </section>
      </div>
    </main>
  );
}

function Background({ reduceMotion }: { reduceMotion: boolean }) {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute -left-32 -top-32 h-[38rem] w-[38rem] rounded-full bg-blue-600/[0.16] blur-[140px]" /><div className="absolute -right-40 top-[5%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.12] blur-[150px]" /><div className="absolute bottom-[-25rem] left-[20%] h-[42rem] w-[42rem] rounded-full bg-blue-700/[0.16] blur-[170px]" /><div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(148,163,184,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.7)_1px,transparent_1px)] [background-size:54px_54px]" />{!reduceMotion && Array.from({ length: 12 }).map((_, index) => <motion.i key={index} className="absolute h-1 w-1 rounded-full bg-cyan-200/50" style={{ left: `${7 + ((index * 17) % 86)}%`, top: `${8 + ((index * 23) % 78)}%` }} animate={{ y: [0, -18 - (index % 3) * 9, 0], opacity: [0.15, 0.8, 0.15] }} transition={{ duration: 4 + (index % 4), delay: index * 0.25, repeat: Infinity, ease: "easeInOut" }} />)}</div>;
}

function FeatureCard({ feature, index, reduced }: { feature: typeof features[number]; index: number; reduced: boolean }) {
  const Icon = feature.icon;
  return <motion.div className={`absolute hidden w-44 rounded-2xl border border-white/[0.1] bg-gradient-to-br ${feature.accent} p-3.5 shadow-2xl backdrop-blur-xl 2xl:block ${feature.position}`} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1, y: reduced ? 0 : [0, -8 - (index % 3) * 3, 0], rotate: reduced ? 0 : [0, index % 2 ? -1.2 : 1.2, 0] }} transition={{ opacity: { duration: 0.6, delay: 0.3 + index * 0.08 }, scale: { duration: 0.6, delay: 0.3 + index * 0.08 }, y: { duration: 5 + index % 3, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 6 + index % 2, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" } }}><div className={`mb-4 inline-flex rounded-xl bg-white/[0.08] p-2 ${feature.color}`}><Icon className="h-4 w-4" /></div><p className="text-xs font-semibold text-white">{feature.title}</p><p className="mt-1 text-[10px] leading-4 text-slate-300">{feature.detail}</p><ChevronRight className="absolute bottom-3.5 right-3.5 h-3.5 w-3.5 text-white/40" /></motion.div>;
}

function Logo() { return <div className="flex items-center gap-2.5"><span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_6px_18px_rgba(6,182,212,.28)]"><span className="absolute inset-px rounded-[10px] border border-white/30" /><span className="relative text-sm font-black tracking-tighter text-slate-950">O</span></span><span className="text-sm font-bold tracking-[0.12em] text-white">ORVION</span></div>; }
function Avatar({ letter }: { letter: string }) { return <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#071225] bg-gradient-to-br from-blue-400 to-cyan-300 text-[10px] font-bold text-slate-950">{letter}</span>; }
