"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  AlertCircle, CheckCircle2, ClipboardList, Download, Filter,
  LogIn, RefreshCw, Search, UserPlus,
} from "lucide-react";

type Raw = Record<string, unknown>;
type Activity = {
  id: string;
  date: Date | null;
  user: string;
  role: string;
  action: string;
  lead: string;
  status: "Success" | "Warning" | "Error" | "Info";
  ip: string;
  device: string;
  result: string;
};

const text = (value: unknown) => typeof value === "string" ? value : "";
const first = (...values: unknown[]) => values.map(text).find(Boolean) ?? "—";
const dateValue = (value: unknown) => { const date = new Date(text(value)); return Number.isNaN(date.getTime()) ? null : date; };
const status = (value: unknown): Activity["status"] => {
  const valueText = text(value).toLowerCase();
  if (valueText.includes("error") || valueText.includes("fail")) return "Error";
  if (valueText.includes("warn") || valueText.includes("pending")) return "Warning";
  if (valueText.includes("info") || valueText.includes("assign")) return "Info";
  return "Success";
};
const asList = (payload: unknown): Raw[] => {
  if (Array.isArray(payload)) return payload as Raw[];
  if (payload && typeof payload === "object") {
    const item = payload as Raw;
    for (const key of ["activities", "logs", "data", "results"]) if (Array.isArray(item[key])) return item[key] as Raw[];
  }
  return [];
};
const person = (value: unknown) => {
  if (value && typeof value === "object") { const item = value as Raw; return first(item.name, item.fullName, item.username, item.email); }
  return text(value);
};

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[0.08] bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-xl ${className}`}>{children}</section>;
}

function badgeClasses(value: Activity["status"]) {
  return value === "Success" ? "bg-emerald-500/15 text-emerald-300" : value === "Warning" ? "bg-amber-500/15 text-amber-300" : value === "Error" ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300";
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("All users");
  const [actionFilter, setActionFilter] = useState("All actions");
  const [range, setRange] = useState("All time");

  const mapActivity = (row: Raw, index: number): Activity => ({
    id: first(row.id, row._id, `activity-${index}`),
    date: dateValue(row.createdAt ?? row.created_at ?? row.timestamp ?? row.date ?? row.updatedAt),
    user: person(row.user ?? row.actor ?? row.executive ?? row.assignedTo) || "System",
    role: first(row.role, (row.user as Raw)?.role, (row.actor as Raw)?.role, "System"),
    action: first(row.action, row.actionType, row.type, row.event, "Activity recorded"),
    lead: first(row.leadName, person(row.lead), row.lead_name, row.company, "—"),
    status: status(row.status ?? row.result ?? row.action),
    ip: first(row.ipAddress, row.ip_address, row.ip, "—"),
    device: first(row.device, row.userAgent, row.user_agent, "—"),
    result: first(row.result, row.message, row.status, "Completed"),
  });
  const mapLead = (lead: Raw, index: number): Activity => {
    const state = first(lead.status, lead.leadStatus, lead.lead_status, "New");
    const activityText = state.toLowerCase().includes("follow") ? "Follow up scheduled" : state.toLowerCase().includes("assign") ? "Lead assigned" : state.toLowerCase().includes("interest") ? "Lead marked interested" : state.toLowerCase().includes("book") ? "Booking recorded" : "Lead created";
    return { id: first(lead.id, lead._id, `lead-${index}`), date: dateValue(lead.updatedAt ?? lead.updated_at ?? lead.createdAt ?? lead.created_at), user: person(lead.executive ?? lead.assignedExecutive ?? lead.assignee ?? lead.owner) || "System", role: first((lead.executive as Raw)?.role, "Executive"), action: activityText, lead: first(lead.name, lead.fullName, lead.full_name, lead.company, lead.email, "Unnamed lead"), status: status(state), ip: "—", device: "—", result: state };
  };
  const loadActivities = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true); setError("");
    try {
      const activityResponse = await fetch("/api/activity", { cache: "no-store" });
      let records: Activity[] = [];
      if (activityResponse.ok) records = asList(await activityResponse.json()).map(mapActivity);
      if (!records.length) {
        const leadsResponse = await fetch("/api/leads", { cache: "no-store" });
        if (!leadsResponse.ok && !activityResponse.ok) throw new Error("Unable to load activities");
        if (leadsResponse.ok) records = asList(await leadsResponse.json()).map(mapLead);
      }
      setActivities(records.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)));
    } catch { setError("We couldn’t load activity logs. Please try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { loadActivities(); }, [loadActivities]);

  const users = useMemo(() => [...new Set(activities.map((item) => item.user).filter((item) => item !== "—"))].sort(), [activities]);
  const actions = useMemo(() => [...new Set(activities.map((item) => item.action))].sort(), [activities]);
  const filtered = useMemo(() => {
    const today = new Date(); const cutoff = range === "Today" ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : range === "Last 7 days" ? new Date(Date.now() - 604800000) : range === "Last 30 days" ? new Date(Date.now() - 2592000000) : null;
    const search = query.trim().toLowerCase();
    return activities.filter((item) => (!search || [item.user, item.action, item.lead, item.result, item.role].some((value) => value.toLowerCase().includes(search))) && (userFilter === "All users" || item.user === userFilter) && (actionFilter === "All actions" || item.action === actionFilter) && (!cutoff || (item.date && item.date >= cutoff)));
  }, [activities, query, userFilter, actionFilter, range]);
  const counts = useMemo(() => ({
    today: activities.filter((item) => item.date?.toDateString() === new Date().toDateString()).length,
    lead: activities.filter((item) => /lead|follow|booking|status/i.test(item.action)).length,
    assigned: activities.filter((item) => /assign/i.test(item.action)).length,
    logins: activities.filter((item) => /login|sign.?in/i.test(item.action)).length,
  }), [activities]);
  const recent = activities.slice(0, 4);
  const exportCsv = () => { const headers = ["Date & Time", "User", "Role", "Action", "Lead", "Status", "IP Address", "Device", "Result"]; const lines = [headers, ...filtered.map((item) => [item.date?.toLocaleString() ?? "—", item.user, item.role, item.action, item.lead, item.status, item.ip, item.device, item.result])]; const csv = lines.map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = `orvion-activity-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href); };
  const cards = [["Today’s Activities", counts.today, ClipboardList, "text-violet-300", "bg-violet-500/10"], ["Lead Updates", counts.lead, CheckCircle2, "text-sky-300", "bg-sky-500/10"], ["Assignments", counts.assigned, UserPlus, "text-amber-300", "bg-amber-500/10"], ["Logins", counts.logins, LogIn, "text-emerald-300", "bg-emerald-500/10"]] as const;

  return <DashboardLayout><main className="min-h-screen bg-[#07111f] px-4 py-5 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1550px]"><header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Audit trail</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Activity Logs</h1><p className="mt-1 text-sm text-slate-400">Track every important action inside ORVION CRM.</p></div><div className="flex gap-2"><button onClick={() => loadActivities(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/[0.09] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"><Download className="h-4 w-4" />Export CSV</button></div></header>
    {loading ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-800/70" />)}</div> : error ? <GlassCard className="py-14 text-center"><AlertCircle className="mx-auto h-9 w-9 text-rose-300" /><p className="mt-3 font-medium">{error}</p><button onClick={() => loadActivities()} className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold">Try again</button></GlassCard> : <><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, value, Icon, color, background]) => <GlassCard key={label} className="p-3.5"><div className="flex items-start justify-between"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><span className={`rounded-lg p-1.5 ${background}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></span></div><p className="mt-3 text-2xl font-bold tracking-tight">{value}</p></GlassCard>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0 space-y-5"><GlassCard className="p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="relative md:col-span-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activities, users or leads..." className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/60" /></div><Select value={userFilter} onChange={setUserFilter} options={["All users", ...users]} /><Select value={actionFilter} onChange={setActionFilter} options={["All actions", ...actions]} /><Select value={range} onChange={setRange} options={["All time", "Today", "Last 7 days", "Last 30 days"]} /></div></GlassCard>{filtered.length === 0 ? <GlassCard className="py-14 text-center"><Filter className="mx-auto h-8 w-8 text-slate-500" /><h2 className="mt-3 font-semibold">No activity found</h2><p className="mt-1 text-sm text-slate-400">Try changing your filters or check back after more actions occur.</p></GlassCard> : <GlassCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="font-semibold">Activity History</h2><p className="mt-0.5 text-xs text-slate-400">{filtered.length} recorded {filtered.length === 1 ? "event" : "events"}</p></div><div className="hidden lg:block"><div className="grid grid-cols-[1.35fr_1fr_.65fr_1.35fr_1.15fr_.75fr_.95fr_1fr_.75fr] gap-2 bg-white/[0.025] px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">{["Date & Time", "User", "Role", "Action", "Lead", "Status", "IP Address", "Device", "Result"].map((name) => <span key={name}>{name}</span>)}</div>{filtered.map((item) => <div key={item.id} className="grid grid-cols-[1.35fr_1fr_.65fr_1.35fr_1.15fr_.75fr_.95fr_1fr_.75fr] gap-2 border-t border-white/[0.06] px-4 py-3.5 text-xs text-slate-300 transition hover:bg-white/[0.025]"><span className="text-slate-400">{item.date?.toLocaleString() ?? "—"}</span><span className="truncate font-medium text-slate-100">{item.user}</span><span>{item.role}</span><span className="truncate">{item.action}</span><span className="truncate">{item.lead}</span><span><Badge value={item.status} /></span><span className="truncate text-slate-400">{item.ip}</span><span className="truncate text-slate-400">{item.device}</span><span className="truncate">{item.result}</span></div>)}</div><div className="space-y-2 p-3 lg:hidden">{filtered.map((item) => <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.action}</p><p className="mt-1 text-xs text-slate-400">{item.date?.toLocaleString() ?? "Date unavailable"}</p></div><Badge value={item.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Info label="User" value={item.user} /><Info label="Lead" value={item.lead} /><Info label="Role" value={item.role} /><Info label="Result" value={item.result} /></div></div>)}</div></GlassCard>}</div><aside className="space-y-5"><GlassCard className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Recent Events</h2><p className="mt-1 text-xs text-slate-400">Latest actions in your CRM</p></div><ClipboardList className="h-5 w-5 text-violet-300" /></div><div className="mt-4 space-y-1">{recent.length ? recent.map((item) => <div className="flex gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.04]" key={item.id}><span className={`mt-0.5 rounded-lg p-2 ${item.status === "Error" ? "bg-rose-500/10 text-rose-300" : item.action.toLowerCase().includes("login") ? "bg-sky-500/10 text-sky-300" : item.action.toLowerCase().includes("assign") ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>{item.action.toLowerCase().includes("login") ? <LogIn className="h-4 w-4" /> : item.action.toLowerCase().includes("assign") ? <UserPlus className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{item.action}</p><p className="truncate text-xs text-slate-400">{item.user} · {item.lead}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.date?.toLocaleString() ?? "Date unavailable"}</p></div></div>) : <p className="py-8 text-center text-sm text-slate-500">No recent events.</p>}</div></GlassCard><GlassCard className="p-5"><h2 className="font-semibold">Audit Status</h2><p className="mt-1 text-xs text-slate-400">Live event categories</p><div className="mt-4 space-y-3"><StatusLine color="bg-emerald-400" label="Success" count={activities.filter((item) => item.status === "Success").length} /><StatusLine color="bg-amber-400" label="Warning" count={activities.filter((item) => item.status === "Warning").length} /><StatusLine color="bg-rose-400" label="Error" count={activities.filter((item) => item.status === "Error").length} /><StatusLine color="bg-sky-400" label="Info" count={activities.filter((item) => item.status === "Info").length} /></div></GlassCard></aside></div></>}</div></main></DashboardLayout>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-400/60">{options.map((item) => <option key={item}>{item}</option>)}</select>; }
function Badge({ value }: { value: Activity["status"] }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badgeClasses(value)}`}>{value}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 truncate text-slate-300">{value}</p></div>; }
function StatusLine({ color, label, count }: { color: string; label: string; count: number }) { return <div className="flex items-center text-sm"><span className={`mr-2 h-2 w-2 rounded-full ${color}`} /><span className="text-slate-300">{label}</span><span className="ml-auto font-semibold">{count}</span></div>; }
