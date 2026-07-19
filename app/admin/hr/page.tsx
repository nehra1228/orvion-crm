"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, CalendarCheck2, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, Download, FileClock, LogIn, RefreshCw, Search,
  ShieldCheck, Sparkles, UsersRound, XCircle,
} from "lucide-react";

type Employee = { id: string; name: string; email?: string; department?: string; designation?: string; status?: string; avatarUrl?: string; employeeId?: string };
type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "LATE" | "UNKNOWN";
type AttendanceItem = { id: string; employeeId: string; name: string; email: string; department: string; role: string; status: AttendanceStatus; markedAt: string | null; day: string | null; avatarUrl?: string };
type AttendancePayload = { items?: unknown[]; counts?: Partial<Record<AttendanceStatus | "total", number>>; total?: number; page?: number; totalPages?: number };
type View = "overview" | "attendance" | "employees";
type Notice = { tone: "success" | "error" | "info"; message: string } | null;

const glass = "border border-white/[0.1] bg-slate-950/60 shadow-[0_28px_90px_-38px_rgba(0,0,0,0.95)] backdrop-blur-2xl";
const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3 py-2.5 text-xs font-semibold text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:pointer-events-none disabled:opacity-40";
const todayIso = () => new Date().toISOString().slice(0, 10);

function obj(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""; }
function title(value: string): string { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function dateTime(value: string | null): string { if (!value) return "Not recorded"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date); }
function time(value: string | null): string { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date); }
function day(value: string | null): string { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function canonicalStatus(value: unknown): AttendanceStatus { const raw = text(value).toUpperCase().replace(/[-\s]/g, "_"); if (raw === "PRESENT" || raw === "ABSENT" || raw === "HALF_DAY" || raw === "ON_LEAVE" || raw === "LATE") return raw; return "UNKNOWN"; }

function attendanceRecord(value: unknown, index: number): AttendanceItem {
  const raw = obj(value); const employee = obj(raw.employee ?? raw.user);
  return {
    id: text(raw.id ?? raw._id) || `${text(raw.employeeId ?? employee.id)}-${index}`,
    employeeId: text(raw.employeeId ?? raw.userId ?? employee.id),
    name: text(raw.name ?? raw.employeeName ?? employee.name ?? employee.fullName ?? employee.username) || "Unnamed executive",
    email: text(raw.email ?? employee.email),
    department: text(raw.department ?? employee.department) || "Unassigned",
    role: text(raw.role ?? employee.role ?? employee.designation) || "Executive",
    status: canonicalStatus(raw.status ?? raw.attendanceStatus),
    markedAt: text(raw.createdAt ?? raw.markedAt ?? raw.checkInAt ?? raw.timestamp) || null,
    day: text(raw.day ?? raw.date ?? raw.attendanceDate) || null,
    avatarUrl: text(raw.avatarUrl ?? employee.avatarUrl) || undefined,
  };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "include", ...init, headers: { ...(!init?.body || init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers } });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(text(obj(payload).message ?? obj(obj(payload).error).message) || `Request failed (${response.status}).`);
  const outer = obj(payload);
  return (outer.data ?? payload) as T;
}

function listFrom(payload: unknown): unknown[] { const source = obj(payload); return Array.isArray(payload) ? payload : Array.isArray(source.items) ? source.items : Array.isArray(source.attendance) ? source.attendance : Array.isArray(source.results) ? source.results : []; }

export default function HRPage() {
  const reducedMotion = useReducedMotion();
  const [view, setView] = useState<View>("attendance");
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "ALL">("ALL");
  const [now, setNow] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentRole, setCurrentRole] = useState("");

  const loadAttendance = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setAttendanceLoading(true); setError("");
    try {
      const payload = await api<AttendancePayload>(`/api/hr/attendance?${new URLSearchParams({ from, to })}`);
      setAttendance(listFrom(payload).map(attendanceRecord));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load attendance records."); }
    finally { setAttendanceLoading(false); setRefreshing(false); }
  }, [from, to]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const payload = await api<unknown>("/api/hr/employees?page=1&pageSize=100");
      const source = obj(payload); const records = Array.isArray(source.items) ? source.items : Array.isArray(source.employees) ? source.employees : Array.isArray(payload) ? payload : [];
      setEmployees(records.map((value) => { const item = obj(value); return { id: text(item.id ?? item._id), name: text(item.name ?? item.fullName) || "Unnamed employee", email: text(item.email), department: text(item.department), designation: text(item.designation ?? item.role), status: text(item.status), avatarUrl: text(item.avatarUrl) || undefined, employeeId: text(item.employeeId) }; }).filter((employee) => employee.id));
    } catch (reason) { setNotice({ tone: "error", message: reason instanceof Error ? reason.message : "Unable to load employees." }); }
    finally { setEmployeesLoading(false); }
  }, []);

  useEffect(() => { void loadAttendance(); }, [loadAttendance]);
  useEffect(() => { if (view === "employees" || view === "overview" || view === "attendance") void loadEmployees(); }, [loadEmployees, view]);
  useEffect(() => { setNow(new Date()); const interval = window.setInterval(() => { setNow(new Date()); if (view === "attendance") void loadAttendance(true); }, 30_000); return () => window.clearInterval(interval); }, [loadAttendance, view]);
  useEffect(() => { void api<{ user?: { role?: string } }>("/api/users/me").then((value) => setCurrentRole(value.user?.role ?? "")).catch(() => setCurrentRole("")); }, []);

  const calculations = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, ON_LEAVE: 0, LATE: 0, UNKNOWN: 0 };
    const unique = new Set<string>();
    attendance.forEach((item) => { counts[item.status] += 1; unique.add(item.employeeId || item.id); });
    const eligible = employees.length || unique.size;
    if (from === to && from === todayIso() && employees.length) {
      counts.ABSENT = Math.max(counts.ABSENT, employees.length - unique.size);
    }
    const presentEquivalent = counts.PRESENT + counts.LATE + (counts.HALF_DAY * 0.5);
    return { counts, unique: unique.size, eligible, attendanceRate: eligible ? Math.round((presentEquivalent / eligible) * 100) : 0 };
  }, [attendance, employees.length, from, to]);

  const filteredAttendance = useMemo(() => attendance.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || [item.name, item.email, item.department, item.role].some((value) => value.toLowerCase().includes(term))) && (statusFilter === "ALL" || item.status === statusFilter);
  }).sort((left, right) => new Date(right.markedAt ?? right.day ?? 0).getTime() - new Date(left.markedAt ?? left.day ?? 0).getTime()), [attendance, query, statusFilter]);

  const markAttendance = async () => {
    setMarking(true);
    try { await api("/api/hr/attendance/mark", { method: "POST", body: JSON.stringify({ status: "PRESENT" }) }); setNotice({ tone: "success", message: "Attendance marked with the current server time." }); await loadAttendance(true); }
    catch (reason) { setNotice({ tone: "error", message: reason instanceof Error ? reason.message : "Unable to mark attendance." }); }
    finally { setMarking(false); }
  };

  const downloadAttendance = async () => {
    if (!from || !to || from > to) { setNotice({ tone: "error", message: "Choose a valid from and to date." }); return; }
    setDownloading(true);
    try {
      const response = await fetch(`/api/hr/attendance?${new URLSearchParams({ from, to, format: "csv" })}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to generate the attendance download.");
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `orvion-attendance-${from}-to-${to}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      setNotice({ tone: "success", message: `Attendance report downloaded for ${from} to ${to}.` });
    } catch (reason) { setNotice({ tone: "error", message: reason instanceof Error ? reason.message : "Unable to download attendance." }); }
    finally { setDownloading(false); }
  };

  const tabs: { id: View; label: string; icon: typeof Activity }[] = [{ id: "overview", label: "Command Center", icon: Activity }, { id: "attendance", label: "Smart Attendance", icon: CalendarCheck2 }, { id: "employees", label: "Executive Directory", icon: UsersRound }];
  const activeTitle = view === "attendance" ? "Smart attendance" : view === "employees" ? "Executive directory" : "People intelligence";
  const attendanceCards: [string, string | number, typeof Activity, string, string][] = [
    ["Attendance rate", `${calculations.attendanceRate}%`, Activity, "text-cyan-200", "bg-cyan-500/15"],
    ["Present", calculations.counts.PRESENT, CheckCircle2, "text-emerald-200", "bg-emerald-500/15"],
    ["Late", calculations.counts.LATE, Clock3, "text-amber-200", "bg-amber-500/15"],
    ["Half day", calculations.counts.HALF_DAY, FileClock, "text-indigo-200", "bg-indigo-500/15"],
    ["On leave", calculations.counts.ON_LEAVE, CalendarCheck2, "text-sky-200", "bg-sky-500/15"],
    ["Absent", calculations.counts.ABSENT, CircleAlert, "text-rose-200", "bg-rose-500/15"],
    ["Marked", calculations.unique, UsersRound, "text-violet-200", "bg-violet-500/15"],
  ];

  return <DashboardLayout><main className="relative min-h-screen overflow-x-hidden bg-[#050816] px-4 py-5 text-slate-100 sm:px-6 lg:px-8"><AnimatedBackdrop /><div className="relative mx-auto max-w-[1720px] space-y-5">
    <header className={`${glass} overflow-hidden rounded-[30px] p-5 sm:p-7`}><div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" />ORVION Workforce OS</div><h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{activeTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A precision people-operations workspace for live workforce visibility, verified attendance, and executive accountability.</p><p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-cyan-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Live clock: {now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Loading..."}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void loadAttendance(true)} className={button}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh live data</button>{!["SUPER_ADMIN", "SUPER_HR"].includes(currentRole) && <button onClick={() => void markAttendance()} disabled={marking} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:opacity-60">{marking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Mark my attendance</button>}</div></div><div className="relative mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-slate-950/55 p-1.5">{tabs.map((tab) => { const Icon = tab.icon; const active = tab.id === view; return <button key={tab.id} onClick={() => setView(tab.id)} className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${active ? "text-slate-950" : "text-slate-400 hover:text-slate-200"}`}>{active && <motion.span layoutId="hr-tab" className="absolute inset-0 rounded-xl bg-cyan-300" transition={{ type: "spring", stiffness: 430, damping: 34 }} />}<Icon className="relative h-4 w-4" /><span className="relative">{tab.label}</span></button>; })}</div></header>

    <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.tone === "error" ? "border-rose-400/20 bg-rose-500/10 text-rose-100" : notice.tone === "success" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"}`}><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><XCircle className="h-4 w-4" /></button></motion.div>}</AnimatePresence>

    <AnimatePresence mode="wait">{view === "attendance" ? <motion.section key="attendance" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }} className="space-y-5"><section className={`${glass} rounded-[28px] p-4 sm:p-5`}><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">Live attendance engine</p><h2 className="mt-2 text-xl font-bold text-white">Every executive mark, counted automatically</h2><p className="mt-1 text-sm text-slate-400">Records refresh every 30 seconds while this slide is open. Each mark preserves the exact submitted date and time returned by your attendance API.</p></div><div className="flex flex-wrap items-end gap-2"><DateInput label="From" value={from} onChange={setFrom} /><DateInput label="To" value={to} onChange={setTo} /><button onClick={() => void downloadAttendance()} disabled={downloading} className={button}>{downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? "Preparing" : "Download CSV"}</button></div></div></section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">{attendanceCards.map(([name, value, Icon, color, background], index) => <motion.div key={name} initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={`${glass} rounded-2xl p-3.5`}><div className="flex items-start justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">{name}</p><span className={`rounded-lg p-1.5 ${background}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></span></div><p className="mt-3 text-2xl font-bold text-white">{String(value)}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.i initial={{ width: 0 }} animate={{ width: `${typeof value === "number" && calculations.eligible ? Math.max(5, Math.min(100, (value / calculations.eligible) * 100)) : calculations.attendanceRate}%` }} className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" /></div></motion.div>)}</section>
      <section className={`${glass} overflow-hidden rounded-[28px]`}><div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="text-base font-semibold text-white">Executive attendance ledger</h2><p className="mt-1 text-xs text-slate-400">Exact date and time are recorded at the moment each executive marks attendance.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search executive" className="w-44 rounded-xl border border-white/[0.1] bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-300/35" /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "ALL")} className="rounded-xl border border-white/[0.1] bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"><option value="ALL">All states</option><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="HALF_DAY">Half day</option><option value="ON_LEAVE">On leave</option><option value="ABSENT">Absent</option></select></div></div>{attendanceLoading ? <SkeletonRows /> : error ? <ErrorState error={error} retry={() => void loadAttendance()} /> : filteredAttendance.length === 0 ? <EmptyState /> : <div className="divide-y divide-white/[0.055]">{filteredAttendance.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, x: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.018, 0.2) }} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 transition hover:bg-cyan-300/[0.025] sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5"><div className="flex min-w-0 items-center gap-3"><Avatar name={item.name} src={item.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.name}</p><p className="truncate text-[11px] text-slate-500">{item.role} · {item.department}</p></div></div><div className="hidden min-w-0 sm:block"><p className="truncate text-xs text-slate-300">{item.email || "No email"}</p><p className="mt-1 text-[10px] uppercase tracking-[.1em] text-slate-500">Executive ID: {item.employeeId || "-"}</p></div><AttendanceBadge status={item.status} /><div className="text-right"><p className="text-xs font-semibold text-slate-200">{time(item.markedAt)}</p><p className="mt-1 text-[10px] text-slate-500">{day(item.day ?? item.markedAt)}</p></div></motion.article>)}</div>}</section></motion.section> : view === "overview" ? <motion.section key="overview" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className={`${glass} rounded-[28px] p-6`}><p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-300">Workforce pulse</p><h2 className="mt-3 text-2xl font-bold text-white">A more precise view of today&apos;s workforce.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Live attendance is calculated from the same executive marks shown in the ledger - no simulated metrics or static dashboard figures.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Pulse label="Marked" value={calculations.unique} /><Pulse label="Present" value={calculations.counts.PRESENT} /><Pulse label="On leave" value={calculations.counts.ON_LEAVE} /><Pulse label="Rate" value={`${calculations.attendanceRate}%`} /></div><button onClick={() => setView("attendance")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950">Open smart attendance <ChevronRight className="h-4 w-4" /></button></section><section className={`${glass} rounded-[28px] p-6`}><h2 className="text-base font-semibold text-white">Engine health</h2><div className="mt-5 space-y-4"><Health label="Automatic refresh" detail="Every 30 seconds on Smart Attendance" ok /><Health label="Record precision" detail="Exact server date and time retained" ok /><Health label="Historical export" detail="CSV for any selected date range" ok /><Health label="Executive self-mark" detail={currentRole ? `Available for ${title(currentRole)}` : "Verifying current role"} ok /></div></section></motion.section> : <motion.section key="employees" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`${glass} overflow-hidden rounded-[28px]`}><div className="flex items-center justify-between gap-3 border-b border-white/[0.08] p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-300">Executive directory</p><h2 className="mt-1 text-xl font-bold text-white">Your executive workforce</h2></div><button onClick={() => void loadEmployees()} className={button}><RefreshCw className={`h-4 w-4 ${employeesLoading ? "animate-spin" : ""}`} />Refresh</button></div>{employeesLoading ? <SkeletonRows /> : employees.length === 0 ? <EmptyState label="No executive records were returned by the HR API." /> : <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-3">{employees.map((employee) => <article key={employee.id} className="flex items-center gap-3 bg-slate-950/70 p-4 transition hover:bg-cyan-300/[0.04]"><Avatar name={employee.name} src={employee.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{employee.name}</p><p className="mt-1 truncate text-xs text-slate-400">{employee.designation || "Executive"} · {employee.department || "Unassigned"}</p><p className="mt-1 truncate text-[10px] uppercase tracking-[.1em] text-slate-500">{employee.status || "ACTIVE"}</p></div></article>)}</div>}</motion.section>}</AnimatePresence>
  </div></main></DashboardLayout>;
}

function AnimatedBackdrop() { return <div className="pointer-events-none fixed inset-0 overflow-hidden"><motion.div animate={{ x: [0, 70, -10, 0], y: [0, 30, 70, 0], scale: [1, 1.08, 0.96, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-32 -top-36 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.12] blur-[140px]" /><motion.div animate={{ x: [0, -70, 15, 0], y: [0, 80, 20, 0], scale: [1, 0.94, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-40 top-1/4 h-[570px] w-[570px] rounded-full bg-blue-600/[0.14] blur-[160px]" /><div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)", backgroundSize: "56px 56px" }} /></div>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block rounded-lg border border-white/[0.1] bg-slate-950 px-2.5 py-2 text-xs font-medium normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/35" /></label>; }
function Avatar({ name, src }: { name: string; src?: string }) { return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-xs font-black text-slate-950">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.split(" ").map((item) => item[0]).slice(0, 2).join("").toUpperCase()}</span>; }
function AttendanceBadge({ status }: { status: AttendanceStatus }) { const style = { PRESENT: "bg-emerald-500/15 text-emerald-200", LATE: "bg-amber-500/15 text-amber-200", HALF_DAY: "bg-indigo-500/15 text-indigo-200", ON_LEAVE: "bg-sky-500/15 text-sky-200", ABSENT: "bg-rose-500/15 text-rose-200", UNKNOWN: "bg-white/[0.07] text-slate-300" }[status]; return <span className={`inline-flex justify-self-start rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>{title(status)}</span>; }
function Pulse({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>; }
function Health({ label, detail, ok }: { label: string; detail: string; ok: boolean }) { return <div className="flex items-start gap-3"><span className={`mt-0.5 rounded-lg p-1.5 ${ok ? "bg-emerald-500/12 text-emerald-200" : "bg-rose-500/12 text-rose-200"}`}><ShieldCheck className="h-3.5 w-3.5" /></span><div><p className="text-xs font-semibold text-slate-200">{label}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div></div>; }
function SkeletonRows() { return <div className="space-y-2 p-5">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white/[0.045]" />)}</div>; }
function ErrorState({ error, retry }: { error: string; retry: () => void }) { return <div className="grid min-h-80 place-items-center p-8 text-center"><div><CircleAlert className="mx-auto h-9 w-9 text-rose-300" /><h2 className="mt-4 text-lg font-bold text-white">Attendance could not be loaded</h2><p className="mt-2 max-w-sm text-sm text-slate-400">{error}</p><button onClick={retry} className="mt-5 rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white">Retry</button></div></div>; }
function EmptyState({ label = "No attendance records were returned for this date range." }: { label?: string }) { return <div className="grid min-h-80 place-items-center p-8 text-center"><div><UsersRound className="mx-auto h-10 w-10 text-cyan-200" /><h2 className="mt-4 text-lg font-bold text-white">No records found</h2><p className="mt-2 max-w-sm text-sm text-slate-400">{label}</p></div></div>; }
