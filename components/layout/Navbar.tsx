"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell, CalendarDays, CheckCheck, ChevronDown, CircleHelp, Command, LogOut,
  Mail, Menu, Search, Settings, UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavbarProps = { title?: string; subtitle?: string };
const pageDetails: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your business, at a glance" },
  leads: { title: "Leads", subtitle: "Manage your sales pipeline" },
  executives: { title: "Executives", subtitle: "Team performance and assignments" },
  calling: { title: "Calling Data", subtitle: "Conversation intelligence" },
  reports: { title: "Reports & Analytics", subtitle: "Performance that tells a story" },
  activity: { title: "Activity Logs", subtitle: "Your workspace audit trail" },
  settings: { title: "Settings", subtitle: "Manage your organization" },
};
const suggestions = [
  { label: "Dashboard", href: "/admin/dashboard" }, { label: "Leads", href: "/admin/leads" }, { label: "Reports & Analytics", href: "/admin/reports" }, { label: "Settings", href: "/admin/settings" },
];
const alerts = [
  { title: "New leads are ready to review", time: "Just now", tone: "bg-cyan-400", icon: UserRound },
  { title: "Follow-ups require attention", time: "18 min ago", tone: "bg-amber-400", icon: CalendarDays },
  { title: "Your activity report is ready", time: "1 hour ago", tone: "bg-violet-400", icon: CheckCheck },
];

export default function Navbar({ title, subtitle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState("Administrator");
  const [userRole, setUserRole] = useState<string>("");
  const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
  const segment = pathSegments[pathSegments.length - 1] ?? "dashboard";
  const detail = pageDetails[segment] ?? { title: segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), subtitle: "ORVION CRM workspace" };

  useEffect(() => {
    const savedUser = window.localStorage.getItem("orvion-login-username");
    if (savedUser) setUsername(savedUser);
    const keydown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); } if (event.key === "Escape") { setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false); } };
    window.addEventListener("keydown", keydown);

    (async () => {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const data = await res.json();
      setUserRole(data.user?.role || "");
    })();

    return () => window.removeEventListener("keydown", keydown);
  }, []);
  const go = (href: string) => { setSearchOpen(false); setProfileOpen(false); router.push(href); };
  const logout = async () => {
    if (userRole === "EXECUTIVE") {
      try {
        await fetch("/api/executive/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({ status: "OFFLINE" }),
        });
      } catch {
        // logout should still proceed even if presence update fails
      }
    }
    window.localStorage.removeItem("orvion-login-username");
    router.push("/login");
  };
  const iconButton = "relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-slate-400 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[0.08] hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/45";

  return <header className="sticky top-0 z-40 px-4 pb-3 pt-4 sm:px-5 lg:px-6"><motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="relative flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/60 px-3 shadow-[0_12px_45px_rgba(0,0,0,.16)] backdrop-blur-xl sm:px-4"><div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" />
    <button onClick={() => window.dispatchEvent(new Event("orvion:toggle-navigation"))} aria-label="Toggle navigation" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/45 lg:hidden"><Menu className="h-5 w-5" /></button>
    <div className="min-w-0 shrink-0"><div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[.12em] text-slate-500"><span>ORVION</span><span className="text-slate-700">/</span><span className="hidden text-slate-400 sm:inline">Admin</span></div><motion.div key={title ?? detail.title} initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}><h1 className="truncate text-sm font-semibold text-white sm:text-base">{title ?? detail.title}</h1><p className="hidden max-w-52 truncate text-[10px] text-slate-500 md:block">{subtitle ?? detail.subtitle}</p></motion.div></div>
    <div className="relative mx-auto hidden w-full max-w-md lg:block"><button onClick={() => setSearchOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/65 px-3 text-left text-xs text-slate-500 transition hover:border-cyan-300/20 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/35"><Search className="h-3.5 w-3.5" /><span>Search anything…</span><span className="ml-auto flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500"><Command className="h-2.5 w-2.5" />K</span></button></div>
    <div className="ml-auto flex items-center gap-1.5"><button onClick={() => setSearchOpen(true)} aria-label="Search" className={`${iconButton} lg:hidden`}><Search className="h-4 w-4" /></button><div className="relative"><button onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen} className={iconButton}><Bell className={`h-4 w-4 ${notificationsOpen ? "text-cyan-200" : ""}`} /><span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-slate-950 bg-cyan-300 px-0.5 text-[8px] font-bold text-slate-950">3</span></button><AnimatePresence>{notificationsOpen && <NotificationPanel close={() => setNotificationsOpen(false)} />}</AnimatePresence></div><button aria-label="Messages" className={`${iconButton} hidden sm:flex`}><Mail className="h-4 w-4" /></button><button aria-label="Calendar" className={`${iconButton} hidden sm:flex`}><CalendarDays className="h-4 w-4" /></button><div className="relative"><button onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-label="Open user menu" aria-expanded={profileOpen} className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition hover:border-white/[0.1] hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cyan-300/45"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-blue-500 text-[10px] font-bold text-white">{username.slice(0, 1).toUpperCase()}</span><span className="hidden max-w-24 text-left lg:block"><span className="block truncate text-[11px] font-semibold text-slate-200">{username}</span><span className="block text-[9px] text-slate-500">Administrator</span></span><ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 lg:block" /></button><AnimatePresence>{profileOpen && <ProfileMenu go={go} logout={logout} />}</AnimatePresence></div></div>
  </motion.div><AnimatePresence>{searchOpen && <CommandPalette items={suggestions} close={() => setSearchOpen(false)} go={go} />}</AnimatePresence></header>;
}

function NotificationPanel({ close }: { close: () => void }) { return <motion.div initial={{ opacity: 0, y: -8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }} transition={{ duration: .18 }} className="absolute right-0 top-11 z-50 w-[310px] overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/95 shadow-2xl shadow-black/45 backdrop-blur-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><div><p className="text-sm font-semibold">Notifications</p><p className="mt-0.5 text-[10px] text-slate-500">3 unread updates</p></div><button onClick={close} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.07] hover:text-white"><CheckCheck className="h-4 w-4" /></button></div><div className="p-2">{alerts.map(({ title, time, tone, icon: Icon }) => <button className="flex w-full gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.05]" key={title}><span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300"><Icon className="h-4 w-4" /><i className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${tone} ring-2 ring-slate-950`} /></span><span className="min-w-0"><span className="block text-xs font-medium text-slate-200">{title}</span><span className="mt-1 block text-[10px] text-slate-500">{time}</span></span></button>)}</div><button className="flex w-full items-center justify-center border-t border-white/[0.07] py-3 text-[11px] font-semibold text-cyan-300 hover:bg-white/[0.035]">View all notifications</button></motion.div>; }
function ProfileMenu({ go, logout }: { go: (href: string) => void; logout: () => void }) { const entries = [{ label: "Profile", icon: UserRound, href: "/admin/settings" }, { label: "Settings", icon: Settings, href: "/admin/settings" }, { label: "Notifications", icon: Bell, href: "/admin/activity" }, { label: "Help & Support", icon: CircleHelp, href: "/admin/settings" }]; return <motion.div initial={{ opacity: 0, y: -8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }} transition={{ duration: .18 }} className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/95 p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl">{entries.map(({ label, icon: Icon, href }) => <button onClick={() => go(href)} key={label} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"><Icon className="h-3.5 w-3.5 text-slate-500" />{label}</button>)}<div className="my-1 border-t border-white/[0.07]" /><button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs text-rose-300 transition hover:bg-rose-500/[0.1]"><LogOut className="h-3.5 w-3.5" />Sign out</button></motion.div>; }
function CommandPalette({ items, close, go }: { items: { label: string; href: string }[]; close: () => void; go: (href: string) => void }) { const [query, setQuery] = useState(""); const matches = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())); return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-start bg-slate-950/70 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={close}><motion.div initial={{ opacity: 0, y: -14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14, scale: .98 }} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-950 shadow-2xl shadow-black/60"><div className="flex items-center gap-3 border-b border-white/[0.08] px-4"><Search className="h-4 w-4 text-cyan-300" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /><kbd className="rounded bg-white/[0.06] px-1.5 py-1 text-[10px] text-slate-500">ESC</kbd></div><div className="p-2"><p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Quick navigation</p>{matches.map((item) => <button key={item.href} onClick={() => go(item.href)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-cyan-300/[0.08] hover:text-white"><span>{item.label}</span><ChevronDown className="h-3.5 w-3.5 -rotate-90 text-slate-500" /></button>)}{!matches.length && <p className="px-3 py-8 text-center text-sm text-slate-500">No matching pages found.</p>}</div></motion.div></motion.div>; }
