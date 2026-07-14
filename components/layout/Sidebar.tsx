"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, BarChart3, Building2, ChevronRight, CircleDot, Headphones, LayoutDashboard,
  LogOut, Settings, ShieldCheck, SquareKanban, UsersRound, X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Departments", href: "/admin/departments", icon: SquareKanban },
  { label: "Teams", href: "/admin/teams", icon: UsersRound },
  { label: "Users", href: "/admin/users", icon: UsersRound },
  { label: "Leads", href: "/admin/leads", icon: CircleDot },
  { label: "Calling CRM", href: "/admin/calling", icon: Headphones },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Activity", href: "/admin/activity", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [username, setUsername] = useState("Administrator");

  useEffect(() => {
    const saved = window.localStorage.getItem("orvion-login-username");
    if (saved) setUsername(saved);
    const toggle = () => setMobileOpen((current) => !current);
    window.addEventListener("orvion:toggle-navigation", toggle);
    return () => window.removeEventListener("orvion:toggle-navigation", toggle);
  }, []);

  const navigate = (href: string) => { setMobileOpen(false); router.push(href); };
  const signOut = () => { window.localStorage.removeItem("orvion-login-username"); router.push("/login"); };
  const activePath = pathname ?? "";
  const body = <div className="flex h-full flex-col">
    <div className="p-2">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/[0.15] bg-gradient-to-br from-blue-500/[0.17] via-slate-950/50 to-cyan-400/[0.08] p-4 shadow-[0_14px_45px_rgba(0,0,0,.2)]">
        <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-cyan-950/50"><span className="absolute inset-px rounded-[15px] border border-white/35" /><span className="relative text-lg font-black tracking-tighter text-slate-950">O</span></span>
          <div className="min-w-0"><p className="truncate text-sm font-bold tracking-[0.14em] text-white">ORVION</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Enterprise CRM</p></div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[10px] font-medium text-emerald-200"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" /></span>All systems operational</div>
      </div>
    </div>
    <div className="mt-4 flex-1 px-2"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p><nav className="mt-2 space-y-1" aria-label="Main navigation">{navigation.map(({ label, href, icon: Icon }) => {
      const active = activePath === href || (href !== "/admin/dashboard" && activePath.startsWith(`${href}/`));
      return <button onClick={() => navigate(href)} key={href} className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-300/45 ${active ? "font-semibold text-white" : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"}`} aria-current={active ? "page" : undefined}>
        {active && <motion.span layoutId="orvion-sidebar-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/45 via-cyan-500/25 to-transparent shadow-[0_0_26px_rgba(34,211,238,.12)]" transition={{ type: "spring", stiffness: 360, damping: 31 }} />}
        <span className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition duration-200 ${active ? "bg-cyan-300/15 text-cyan-100" : "bg-transparent text-slate-500 group-hover:bg-white/[0.07] group-hover:text-cyan-200"}`}><Icon className="h-4 w-4 transition duration-200 group-hover:scale-110 group-hover:-rotate-3" /></span><span className="relative flex-1">{label}</span>{active ? <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="relative h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_#67e8f9]" /> : <ChevronRight className="relative h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-60" />}
      </button>;
    })}</nav></div>
    <div className="p-2"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white shadow-lg shadow-violet-950/35">{username.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{username}</p><p className="mt-0.5 text-[10px] text-slate-500">Administrator · ORVION</p></div></div><div className="mt-3 flex gap-2"><button onClick={() => navigate("/admin/settings")} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-cyan-300/45"><ShieldCheck className="h-3.5 w-3.5" />Account</button><button onClick={signOut} aria-label="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/[0.08] text-rose-300 transition hover:bg-rose-500/[0.17] focus:outline-none focus:ring-2 focus:ring-rose-300/45"><LogOut className="h-3.5 w-3.5" /></button></div></div></div>
  </div>;

  return <><aside className="hidden lg:flex lg:h-screen lg:w-[292px] lg:shrink-0 lg:p-4"><motion.div initial={{ opacity: 0, x: reducedMotion ? 0 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-[30px] border border-white/[0.1] bg-slate-950/70 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl"><div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,.06),transparent_25%,transparent_75%,rgba(34,211,238,.035))]" />{body}</motion.div></aside><AnimatePresence>{mobileOpen && <><motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden" /><motion.aside initial={{ x: "-105%" }} animate={{ x: 0 }} exit={{ x: "-105%" }} transition={{ type: "spring", damping: 29, stiffness: 330 }} className="fixed inset-y-3 left-3 z-[60] w-[290px] overflow-hidden rounded-[30px] border border-white/[0.1] bg-slate-950/95 shadow-2xl backdrop-blur-2xl lg:hidden"><button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>{body}</motion.aside></>}</AnimatePresence></>;
}
