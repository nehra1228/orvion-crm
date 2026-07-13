"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Activity, ArrowDownToLine, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2,
  Clock3, Download, FileText, Phone, RefreshCw, Users, XCircle,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type Lead = Record<string, unknown>;

const COLORS = ["#7c3aed", "#22c55e", "#38bdf8", "#f59e0b", "#f43f5e", "#64748b"];
const statusOrder = ["new", "interested", "follow up", "booked", "lost"];

const titleCase = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const asText = (value: unknown) => (typeof value === "string" ? value : "");
const dateOf = (lead: Lead) => {
  const value = lead.createdAt ?? lead.created_at ?? lead.updatedAt ?? lead.updated_at ?? lead.date;
  const parsed = new Date(asText(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const statusOf = (lead: Lead) => {
  const raw = asText(lead.status ?? lead.leadStatus ?? lead.lead_status ?? "new").toLowerCase().trim();
  if (raw.includes("interest")) return "interested";
  if (raw.includes("follow")) return "follow up";
  if (raw.includes("book") || raw.includes("meeting") || raw.includes("convert")) return "booked";
  if (raw.includes("lost") || raw.includes("reject") || raw.includes("not interest")) return "lost";
  return "new";
};
const executiveOf = (lead: Lead) => {
  const executive = lead.executive ?? lead.assignedExecutive ?? lead.assigned_to ?? lead.assignee ?? lead.owner;
  if (typeof executive === "object" && executive) return asText((executive as Lead).name ?? (executive as Lead).fullName ?? (executive as Lead).email) || "Unassigned";
  return asText(executive) || "Unassigned";
};
const sourceOf = (lead: Lead) => asText(lead.source ?? lead.leadSource ?? lead.lead_source ?? "Direct") || "Direct";
const nameOf = (lead: Lead) => asText(lead.name ?? lead.fullName ?? lead.full_name ?? lead.company ?? lead.email) || "Unnamed lead";
const callCount = (lead: Lead) => Number(lead.calls ?? lead.callCount ?? lead.call_count ?? 0) || 0;

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[0.08] bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur ${className}`}>{children}</section>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-2xl"><p className="mb-1 text-slate-300">{label}</p>{payload.map((item, i) => <p key={i} style={{ color: item.color }} className="font-semibold">{item.name}: {item.value}</p>)}</div>;
}

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load reports");
      const payload = await response.json();
      const collection = Array.isArray(payload) ? payload : payload.leads ?? payload.data ?? payload.results ?? [];
      setLeads(Array.isArray(collection) ? collection : []);
    } catch {
      setError("We couldn’t load your reporting data. Please try again.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const data = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const statuses = Object.fromEntries(statusOrder.map((status) => [status, 0])) as Record<string, number>;
    const sources = new Map<string, number>(); const executives = new Map<string, { assigned: number; interested: number; booked: number; followUps: number }>();
    const monthMap = new Map<string, number>(); const dayMap = new Map<string, number>(); const weekMap = new Map<string, { total: number; booked: number }>();
    let newLeads = 0; let todaysCalls = 0;
    leads.forEach((lead) => {
      const status = statusOf(lead); const created = dateOf(lead); const executive = executiveOf(lead); const source = sourceOf(lead);
      statuses[status] = (statuses[status] ?? 0) + 1; sources.set(source, (sources.get(source) ?? 0) + 1);
      const perf = executives.get(executive) ?? { assigned: 0, interested: 0, booked: 0, followUps: 0 };
      perf.assigned++; if (status === "interested") perf.interested++; if (status === "booked") perf.booked++; if (status === "follow up") perf.followUps++; executives.set(executive, perf);
      if (created) {
        if (created.toDateString() === today) { newLeads++; todaysCalls += callCount(lead); }
        const month = created.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
        const day = created.toLocaleDateString("en-US", { weekday: "short" }); dayMap.set(day, (dayMap.get(day) ?? 0) + callCount(lead));
        const week = `Week ${Math.ceil(created.getDate() / 7)}`; const weekly = weekMap.get(week) ?? { total: 0, booked: 0 }; weekly.total++; if (status === "booked") weekly.booked++; weekMap.set(week, weekly);
      }
    });
    const executivesData = [...executives.entries()].map(([name, values]) => ({ name, ...values, conversion: values.assigned ? Math.round((values.booked / values.assigned) * 100) : 0 })).sort((a, b) => b.booked - a.booked || b.interested - a.interested);
    return {
      statuses, newLeads, todaysCalls,
      statusData: statusOrder.map((name) => ({ name: titleCase(name), value: statuses[name] ?? 0 })),
      sourceData: [...sources.entries()].map(([name, leads]) => ({ name, leads })).sort((a, b) => b.leads - a.leads).slice(0, 6),
      executiveData: executivesData, trend: [...monthMap.entries()].map(([month, leads]) => ({ month, leads })).slice(-6),
      daily: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, calls: dayMap.get(day) ?? 0 })),
      weekly: [...weekMap.entries()].map(([week, value]) => ({ week, conversion: value.total ? Math.round((value.booked / value.total) * 100) : 0 })).slice(-5),
    };
  }, [leads]);

  const conversion = leads.length ? Math.round(((data.statuses.booked ?? 0) / leads.length) * 100) : 0;
  const exportReport = (type: "csv" | "print") => {
    if (type === "print") { window.print(); return; }
    const rows = [["Lead", "Status", "Source", "Executive", "Created"], ...leads.map((lead) => [nameOf(lead), titleCase(statusOf(lead)), sourceOf(lead), executiveOf(lead), dateOf(lead)?.toLocaleDateString() ?? "—"])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `orvion-reports-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const kpis = [
    ["Total Leads", leads.length, Users, "text-violet-300", "bg-violet-500/10"], ["New Leads", data.newLeads, Activity, "text-sky-300", "bg-sky-500/10"],
    ["Interested", data.statuses.interested, CheckCircle2, "text-emerald-300", "bg-emerald-500/10"], ["Follow Ups", data.statuses["follow up"], Clock3, "text-amber-300", "bg-amber-500/10"],
    ["Booked", data.statuses.booked, CalendarDays, "text-cyan-300", "bg-cyan-500/10"], ["Lost", data.statuses.lost, XCircle, "text-rose-300", "bg-rose-500/10"],
    ["Conversion Rate", `${conversion}%`, ArrowUpRight, "text-green-300", "bg-green-500/10"], ["Today’s Calls", data.todaysCalls, Phone, "text-indigo-300", "bg-indigo-500/10"],
  ] as const;
  const activities = [...leads].sort((a, b) => (dateOf(b)?.getTime() ?? 0) - (dateOf(a)?.getTime() ?? 0)).slice(0, 7);
  const bestExecutive = data.executiveData[0]; const bestSource = data.sourceData[0]; const activeDay = [...data.daily].sort((a, b) => b.calls - a.calls)[0];

  return <DashboardLayout>
    <div className="min-h-screen bg-[#07111f] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Business intelligence</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports &amp; Analytics</h1><p className="mt-1 text-sm text-slate-400">Monitor lead performance, executive productivity and business growth.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => loadReports(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/[0.09] disabled:opacity-60" disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button><button onClick={() => exportReport("csv")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"><Download className="h-4 w-4" />Export Excel</button><button onClick={() => exportReport("print")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/[0.09]"><FileText className="h-4 w-4" />Export PDF</button></div>
        </header>
        {loading ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-800/70" />)}</div> : error ? <GlassCard className="p-10 text-center"><BarChart3 className="mx-auto mb-3 h-9 w-9 text-rose-300" /><p className="font-semibold">{error}</p><button onClick={() => loadReports()} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold">Try again</button></GlassCard> : leads.length === 0 ? <GlassCard className="p-12 text-center"><BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-500" /><h2 className="font-semibold">No lead data yet</h2><p className="mt-1 text-sm text-slate-400">Reports will populate as soon as leads are added.</p></GlassCard> : <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">{kpis.map(([label, value, Icon, color, bg]) => <GlassCard key={label} className="min-w-0 p-3.5"><div className="flex items-start justify-between gap-2"><p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><span className={`rounded-lg p-1.5 ${bg}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></span></div><p className="mt-3 text-2xl font-bold tracking-tight">{value}</p></GlassCard>)}</div>
          <div className="mt-5 grid gap-5 xl:grid-cols-12"><div className="space-y-5 xl:col-span-9">
            <div className="grid gap-5 lg:grid-cols-2"><GlassCard className="p-5"><h2 className="font-semibold">Lead Status Distribution</h2><p className="text-xs text-slate-400">Current pipeline composition</p><div className="mt-3 h-64"><ResponsiveContainer><PieChart><Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3}>{data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">{data.statusData.map((item, i) => <div className="flex items-center gap-1.5" key={item.name}><i className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} /><span className="text-slate-400">{item.name}</span><span className="ml-auto font-semibold">{item.value}</span></div>)}</div></GlassCard><GlassCard className="p-5"><h2 className="font-semibold">Monthly Lead Trend</h2><p className="text-xs text-slate-400">New leads created over time</p><div className="mt-4 h-72"><ResponsiveContainer><AreaChart data={data.trend}><defs><linearGradient id="leadFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={.45}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="month" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip />}/><Area type="monotone" dataKey="leads" name="Leads" stroke="#a78bfa" strokeWidth={2.5} fill="url(#leadFill)"/></AreaChart></ResponsiveContainer></div></GlassCard></div>
            <div className="grid gap-5 lg:grid-cols-2"><GlassCard className="p-5"><h2 className="font-semibold">Lead Sources</h2><p className="text-xs text-slate-400">Highest-volume acquisition channels</p><div className="mt-4 h-64"><ResponsiveContainer><BarChart data={data.sourceData}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip />}/><Bar dataKey="leads" name="Leads" fill="#38bdf8" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></GlassCard><GlassCard className="p-5"><h2 className="font-semibold">Executive Performance</h2><p className="text-xs text-slate-400">Bookings by executive</p><div className="mt-4 h-64"><ResponsiveContainer><BarChart data={data.executiveData.slice(0, 6)} layout="vertical"><CartesianGrid horizontal={false} stroke="#ffffff12"/><XAxis type="number" allowDecimals={false} tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={85} tick={{fill:"#cbd5e1",fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip />}/><Bar dataKey="booked" name="Booked" fill="#22c55e" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></GlassCard></div>
            <div className="grid gap-5 lg:grid-cols-2"><GlassCard className="p-5"><h2 className="font-semibold">Daily Calls</h2><p className="text-xs text-slate-400">Recorded calls by day of week</p><div className="mt-4 h-56"><ResponsiveContainer><LineChart data={data.daily}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="day" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip />}/><Line dataKey="calls" name="Calls" stroke="#f59e0b" strokeWidth={2.5} dot={{fill:"#f59e0b",r:3}}/></LineChart></ResponsiveContainer></div></GlassCard><GlassCard className="p-5"><h2 className="font-semibold">Weekly Conversion</h2><p className="text-xs text-slate-400">Bookings as a share of leads created</p><div className="mt-4 h-56"><ResponsiveContainer><AreaChart data={data.weekly}><defs><linearGradient id="conversionFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={.4}/><stop offset="100%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="week" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><YAxis unit="%" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltip />}/><Area type="monotone" dataKey="conversion" name="Conversion" stroke="#22c55e" strokeWidth={2.5} fill="url(#conversionFill)"/></AreaChart></ResponsiveContainer></div></GlassCard></div>
            <GlassCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="font-semibold">Top Executives</h2><p className="text-xs text-slate-400">Team performance at a glance</p></div><Users className="h-5 w-5 text-violet-300"/></div><div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-sm"><thead className="bg-white/[0.025] text-[11px] uppercase tracking-wider text-slate-400"><tr>{["Executive","Assigned Leads","Interested","Booked","Follow Ups","Conversion %","Performance"].map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{data.executiveData.map((item, i) => <tr key={item.name} className="border-t border-white/[0.06] transition hover:bg-white/[0.025]"><td className="px-5 py-3.5 font-medium text-white">{item.name}</td><td className="px-5 py-3.5 text-slate-300">{item.assigned}</td><td className="px-5 py-3.5 text-emerald-300">{item.interested}</td><td className="px-5 py-3.5 text-cyan-300">{item.booked}</td><td className="px-5 py-3.5 text-amber-300">{item.followUps}</td><td className="px-5 py-3.5 font-semibold">{item.conversion}%</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${i === 0 ? "bg-emerald-500/15 text-emerald-300" : item.conversion >= conversion ? "bg-violet-500/15 text-violet-300" : "bg-slate-700/60 text-slate-300"}`}>{i === 0 ? "Top performer" : item.conversion >= conversion ? "On track" : "Developing"}</span></td></tr>)}</tbody></table></div></GlassCard>
          </div><aside className="space-y-5 xl:col-span-3"><GlassCard className="p-5"><h2 className="font-semibold">Quick Insights</h2><p className="mt-1 text-xs text-slate-400">Live signals from your pipeline</p><div className="mt-5 space-y-4"><Insight label="Best Performing Executive" value={bestExecutive?.name ?? "—"} detail={bestExecutive ? `${bestExecutive.booked} bookings` : "No assignments yet"} icon={<Users className="h-4 w-4 text-violet-300"/>}/><Insight label="Best Lead Source" value={bestSource?.name ?? "—"} detail={bestSource ? `${bestSource.leads} leads generated` : "No source data yet"} icon={<BarChart3 className="h-4 w-4 text-sky-300"/>}/><Insight label="Most Active Day" value={activeDay?.calls ? activeDay.day : "—"} detail={activeDay?.calls ? `${activeDay.calls} recorded calls` : "No calls recorded"} icon={<Phone className="h-4 w-4 text-amber-300"/>}/><Insight label="Average Response Time" value="Not tracked" detail="Unavailable in lead records" icon={<Clock3 className="h-4 w-4 text-slate-300"/>}/><Insight label="Conversion Trend" value={`${conversion}%`} detail={conversion >= 15 ? "Healthy booking rate" : "Opportunity to improve"} icon={<ArrowUpRight className="h-4 w-4 text-emerald-300"/>}/></div></GlassCard><GlassCard className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Recent Activities</h2><p className="mt-1 text-xs text-slate-400">Newest lead activity first</p></div><Activity className="h-5 w-5 text-violet-300"/></div><div className="mt-4 space-y-1">{activities.map((lead, i) => { const status = statusOf(lead); return <div className="flex gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.035]" key={`${nameOf(lead)}-${i}`}><span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-violet-500/10 text-center text-xs font-bold leading-8 text-violet-300">{nameOf(lead).slice(0,1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{nameOf(lead)}</p><p className="truncate text-xs text-slate-400">{titleCase(status)} · {sourceOf(lead)}</p><p className="mt-0.5 text-[11px] text-slate-500">{dateOf(lead)?.toLocaleString() ?? "Date unavailable"}</p></div></div>; })}</div></GlassCard></aside></div>
        </>}
      </div>
    </div>
  </DashboardLayout>;
}

function Insight({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 rounded-lg bg-white/[0.05] p-2">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-slate-100">
          {value}
        </p>

        <p className="text-xs text-slate-400">
          {detail}
        </p>
      </div>
    </div>
  );
}
