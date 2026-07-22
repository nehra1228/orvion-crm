"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getMarkInStatus, isAfterMarkInWindow } from "@/lib/attendance";
import {
  ArrowRight, Bell, CalendarClock, CheckCircle2, ChevronRight, CircleUserRound,
  Download, FileSpreadsheet, Headphones, MessageCircle, Phone,
  RefreshCw, Search, Sparkles, Target, Trash2, Upload, UsersRound, X,
} from "lucide-react";

type Tab = "today" | "calling" | "autocaller" | "workspace";
type Remark = "INTERESTED" | "FOLLOW_UP" | "BOOKED" | "SITE_VISIT" | "NOT_INTERESTED" | "WRONG_NUMBER" | "BUSY" | "NO_ANSWER";
type Lead = { id: string; name: string; mobile: string; project: string; city: string; source: string; status: string; remark: string; followUpDate: string; notes: string };
type Dashboard = {
  executive?: { name?: string; shift?: string; campaign?: string; status?: string };
  metrics?: Record<string, number>;
  queue?: unknown[]; followUps?: unknown[]; callingDataLeads?: unknown[]; autocallerLeads?: unknown[]; interestedLeads?: unknown[]; recentCalls?: unknown[];
  totals?: { queue?: number; callingData?: number; autocaller?: number };
};

const remarkOptions: Remark[] = ["INTERESTED", "FOLLOW_UP", "BOOKED", "SITE_VISIT", "NOT_INTERESTED", "WRONG_NUMBER", "BUSY", "NO_ANSWER"];
const surface = "relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.08)]";
const buttonBase = "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-slate-200 hover:shadow-[0_14px_32px_-20px_rgba(34,211,238,.16)] focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:pointer-events-none disabled:opacity-40";
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

function leadFrom(value: unknown, index: number): Lead {
  const raw = object(value);
  return { id: text(raw.id ?? raw._id ?? raw.leadId) || `lead-${index}`, name: text(raw.name ?? raw.fullName ?? raw.customerName) || "Unnamed lead", mobile: text(raw.mobile ?? raw.phone ?? raw.phoneNumber), project: text(raw.project ?? raw.projectName) || "No project", city: text(raw.city), source: text(raw.source ?? raw.leadSource) || "Direct", status: text(raw.status) || "NEW", remark: text(raw.remark ?? raw.callRemark), followUpDate: text(raw.followUpDate ?? raw.nextFollowUpAt), notes: text(raw.notes) };
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const json = await response.json().catch(() => null);
  if (!response.ok) { const body = object(json); throw new Error(text(body.message ?? object(body.error).message) || `Request failed (${response.status})`); }
  const body = object(json); return (body.data ?? json) as T;
}
function badge(value: string) {
  const key = value.toUpperCase();
  if (key.includes("INTEREST")) return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (key.includes("FOLLOW") || key.includes("BUSY")) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (key.includes("BOOK") || key.includes("SITE")) return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  if (key.includes("NOT") || key.includes("WRONG") || key.includes("NO")) return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  return "border-violet-300/20 bg-violet-300/10 text-violet-100";
}

export default function ExecutiveDashboard() {
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<Dashboard>({});
  const [rows, setRows] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(12);
  const [attendanceStatus, setAttendanceStatus] = useState<string>("OFFLINE");
  const [now, setNow] = useState<Date>(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await api<Dashboard>(`/api/executive/dashboard?take=${visible}`);
      setData(dashboard);
      setAttendanceStatus(dashboard.executive?.status ?? "OFFLINE");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [visible]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const interval = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(interval); }, []);
  const today = useMemo(() => (data.queue ?? []).map(leadFrom), [data.queue]);
  const calling = useMemo(() => (data.callingDataLeads ?? []).map(leadFrom), [data.callingDataLeads]);
  const interested = useMemo(() => (data.interestedLeads ?? []).map(leadFrom), [data.interestedLeads]);
  const workspaceLeads = useMemo(() => interested, [interested]);
  useEffect(() => { setRows(workspaceLeads); setSelected([]); }, [workspaceLeads]);
  const currentList = tab === "calling" ? calling : today;
  const filteredList = currentList.filter((lead) => `${lead.name} ${lead.mobile} ${lead.project}`.toLowerCase().includes(query.toLowerCase()));
  const filteredWorkspace = rows.filter((lead) => `${lead.name} ${lead.mobile} ${lead.project} ${lead.remark}`.toLowerCase().includes(search.toLowerCase()));
  const target = Math.max(300, data.metrics?.todayTarget ?? data.metrics?.target ?? 0);
  const metrics = { calls: data.metrics?.todayCalls ?? 0, interested: data.metrics?.interested ?? 0, booked: data.metrics?.booked ?? 0, followUps: data.metrics?.followUps ?? 0, remaining: Math.max(target - (data.metrics?.todayCalls ?? 0), 0), conversion: data.metrics?.todayCalls ? Math.round(((data.metrics?.interested ?? 0) / data.metrics?.todayCalls) * 100) : 0, avgTime: text(data.metrics?.averageTalkTime ?? "00:00") };
  const attendance = attendanceStatus ? label(attendanceStatus) : "Offline";
  const markInStatus = getMarkInStatus(now);
  const isMarkInVisible = attendanceStatus === "OFFLINE" && isAfterMarkInWindow(now) && !!markInStatus;
  const progress = target ? Math.min(100, Math.round((metrics.calls / target) * 100)) : 0;
  const whatsapp = (lead: Lead) => { const phone = lead.mobile.replace(/\D/g, ""); if (!phone) return setNotice(`${lead.name} has no WhatsApp number.`); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${lead.name}, this is ORVION CRM executive following up on your enquiry.`)}`, "_blank", "noopener,noreferrer"); };
  const manualCall = async (lead: Lead) => {
    const phone = lead.mobile.replace(/\D/g, "");
    if (!phone) return setNotice(`${lead.name} has no phone number.`);

    try {
      await api("/api/executive/calls", { method: "POST", body: JSON.stringify({ leadId: lead.id }) });
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "Unable to record call. Proceeding to dial.");
    }

    window.location.href = `tel:${phone}`;
  };
  const setExecutivePresence = async (status: string) => {
    try {
      const response = await fetch("/api/executive/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Unable to update attendance.");
      }
      const { state } = await response.json();
      setAttendanceStatus(state?.status ?? status);
      setNotice(`Attendance marked ${status.replaceAll("_", " ").toLowerCase()}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update attendance.");
    }
  };
  const logoutExecutive = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        setNotice("Unable to logout.");
      }
    } catch {
      setNotice("Unable to logout.");
    }
  };
  const submitRemark = async (lead: Lead, value: Remark) => { setSaving(true); try { await api("/api/executive/leads", { method: "PATCH", body: JSON.stringify({ leadId: lead.id, status: lead.status, remark: value, notes: lead.notes || null, followUpDate: lead.followUpDate || null }) }); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save remark."); } finally { setSaving(false); } };
  const updateRow = (id: string, key: keyof Omit<Lead, "id" | "source">, value: string) => setRows((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const saveRow = async (lead: Lead) => { setSaving(true); try { await api("/api/executive/leads", { method: "PATCH", body: JSON.stringify({ leadId: lead.id, status: lead.status, remark: lead.remark || null, notes: lead.notes || null, followUpDate: lead.followUpDate || null }) }); setNotice(`${lead.name} updated.`); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update lead."); } finally { setSaving(false); } };
  const removeRows = async (ids: string[]) => { if (!ids.length || !window.confirm(`Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}?`)) return; setSaving(true); try { await Promise.all(ids.filter((id) => !id.startsWith("local-")).map((leadId) => api("/api/executive/leads", { method: "DELETE", body: JSON.stringify({ leadId }) }))); setRows((items) => items.filter((item) => !ids.includes(item.id))); setSelected((items) => items.filter((id) => !ids.includes(id))); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to delete selected leads."); } finally { setSaving(false); } };
  const exportRows = () => { const csv = [["Name", "Mobile", "Project", "City", "Status", "Remark", "Follow Up", "Notes"], ...rows.map((lead) => [lead.name, lead.mobile, lead.project, lead.city, lead.status, lead.remark, lead.followUpDate, lead.notes])].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "orvion-leads-workspace.csv"; anchor.click(); URL.revokeObjectURL(url); };
  const addLead = () => { const next = `local-${Date.now()}`; setRows((items) => [{ id: next, name: "New lead", mobile: "", project: "", city: "", source: "Manual", status: "NEW", remark: "", followUpDate: "", notes: "" }, ...items]); };
  const tabs: { id: Tab; title: string; sub: string; icon: ReactNode }[] = [
    { id: "today", title: "Today's Leads", sub: "Priority outreach", icon: <UsersRound /> }, { id: "calling", title: "Calling Data", sub: "Manual call queue", icon: <Phone /> }, { id: "autocaller", title: "Autocaller", sub: "Dialer controls", icon: <Headphones /> }, { id: "workspace", title: "Lead Workspace", sub: "Interested & follow-ups", icon: <FileSpreadsheet /> },
  ];

  return <main className="relative min-h-screen overflow-x-hidden bg-slate-100 px-3 py-4 text-slate-900 sm:px-5 sm:py-6 lg:px-7 lg:py-8">
    <div className="pointer-events-none fixed inset-0 overflow-hidden"><motion.div animate={{ x: [0, 45, 0], y: [0, -25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-48 -top-40 h-[620px] w-[620px] rounded-full bg-cyan-400/[.12] blur-[160px]" /><motion.div animate={{ x: [0, -55, 0], y: [0, 35, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-44 bottom-0 h-[650px] w-[650px] rounded-full bg-indigo-500/[.12] blur-[185px]" /><div className="absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(148,163,184,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.06)_1px,transparent_1px)] [background-size:64px_64px]" /></div>
    <div className="relative mx-auto max-w-[1700px] space-y-4 sm:space-y-5">
      <header className={`${surface} p-5 sm:p-6`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4"><div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[21px] border border-cyan-100/20 bg-gradient-to-br from-cyan-300 to-indigo-400 text-lg font-black text-slate-950 shadow-[0_12px_32px_-13px_rgba(34,211,238,.75)]">{(data.executive?.name ?? "E").slice(0, 1).toUpperCase()}<span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#0b1327] bg-emerald-400" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-200">ORVION / EXECUTIVE COMMAND CENTER</p><h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, {data.executive?.name ?? "Executive"}</h1><p className="mt-1 text-sm text-slate-400">Your focused workspace for every conversation and outcome.</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><div className="hidden rounded-2xl border border-white/[.07] bg-black/10 px-3 py-2.5 text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Live time</p><p className="mt-0.5 text-sm font-semibold">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div><button onClick={() => void load()} className={buttonBase} aria-label="Refresh dashboard"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button>{isMarkInVisible ? <button onClick={() => void setExecutivePresence(markInStatus)} className={`${buttonBase} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}><span>Mark in</span></button> : null}<button onClick={logoutExecutive} className={`${buttonBase} bg-rose-500 text-white hover:bg-rose-400`}><span>Logout</span></button></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr]">
          <MiniDetail icon={<CalendarClock />} label="Shift" value={data.executive?.shift ?? "Unassigned"} /><MiniDetail icon={<Target />} label="Campaign" value={data.executive?.campaign ?? "No campaign"} /><MiniDetail icon={<CheckCircle2 />} label="Attendance" value={attendance} />
          <div className="rounded-2xl border border-white/[.07] bg-white/[.035] px-4 py-3"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Daily target</p><p className="text-sm font-semibold text-cyan-100">{metrics.calls}/{target || "—"}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .7 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" /></div></div>
        </div>
      </header>

      <section className={`${surface} p-5 sm:p-6`}><div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-400/[.1] blur-3xl" /><div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]"><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-violet-200">TODAY'S MISSION</p><h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Move every meaningful conversation toward its next best action.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Start with the priority queue, record the outcome, and keep qualified opportunities organised in your workspace.</p><div className="mt-5 flex flex-wrap gap-2">{["Attendance", "Today's Leads", "Calling Data", "Autocaller", "Workspace"].map((step, index) => <div key={step} className="flex items-center gap-2 text-xs font-medium text-slate-300"><span className={`grid h-6 w-6 place-items-center rounded-full ${index === 0 ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[.06] text-slate-400"}`}>{index + 1}</span><span>{step}</span>{index < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}</div>)}</div></div><div className="flex items-center gap-4 rounded-3xl border border-cyan-200/[.12] bg-cyan-300/[.055] p-4"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#67e8f9 ${progress * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}><div className="grid h-[66px] w-[66px] place-items-center rounded-full bg-[#0a1226]"><span className="text-lg font-semibold">{progress}%</span></div></div><div><p className="text-xs font-semibold text-cyan-100">Mission progress</p><p className="mt-1 text-sm text-slate-400">{metrics.remaining} calls remaining to today’s target.</p></div></div></div></section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"><Metric icon={<Phone />} label="Today's Calls" value={metrics.calls} accent="cyan" /><Metric icon={<UsersRound />} label="Interested" value={metrics.interested} accent="emerald" /><Metric icon={<CheckCircle2 />} label="Booked" value={metrics.booked} accent="blue" /><Metric icon={<CalendarClock />} label="Follow Ups" value={metrics.followUps} accent="amber" /><Metric icon={<Target />} label="Conversion" value={`${metrics.conversion}%`} accent="violet" /><Metric icon={<Sparkles />} label="Remaining" value={metrics.remaining} accent="cyan" /><Metric icon={<CalendarClock />} label="Avg. Call Time" value={metrics.avgTime} accent="indigo" /><Metric icon={<UsersRound />} label="Queue" value={today.length} accent="emerald" /></section>

      <section className={`${surface} p-2`}><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-[21px] px-4 text-left transition duration-300 ${tab === item.id ? "bg-gradient-to-br from-cyan-300 to-blue-400 text-slate-950 shadow-[0_15px_36px_-18px_rgba(34,211,238,.9)]" : "text-slate-400 hover:bg-white/[.05] hover:text-slate-100"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tab === item.id ? "bg-slate-950/25" : "bg-white/[.055] text-cyan-200"}`}>{item.icon}</span><span><span className="block text-sm font-semibold">{item.title}</span><span className={`mt-0.5 block text-xs ${tab === item.id ? "text-slate-800/75" : "text-slate-500"}`}>{item.sub}</span></span>{tab === item.id && <motion.span layoutId="active-tab" className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-white/90" />}</button>)}</div></section>

      <AnimatePresence mode="wait"><motion.section key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: .22 }} className={`${surface} p-4 sm:p-5`}>
        {loading ? <Loading /> : tab === "autocaller" ? <AutocallerPlaceholder /> : tab === "workspace" ? <WorkspacePanel rows={filteredWorkspace} selected={selected} saving={saving} search={search} onSearch={setSearch} onToggle={(id) => setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} onSelectAll={() => setSelected(filteredWorkspace.map((lead) => lead.id))} onAdd={addLead} onExport={exportRows} onUpload={() => setNotice("Upload is managed by Admin. Use the main Upload module.")} onDeleteSelected={() => removeRows(selected)} onDeleteAll={() => removeRows(rows.map((lead) => lead.id))} onUpdate={updateRow} onSave={saveRow} onWhatsapp={whatsapp} selectedCount={selected.length} /> : <LeadCollection title={tab === "today" ? "Today's Leads" : "Calling Data"} subtitle={tab === "today" ? "Fresh priority leads ready for immediate outreach." : "Manual outbound queue — calls are counted once per lead, not per button click."} leads={filteredList.slice(0, visible)} query={query} onQuery={setQuery} onCall={manualCall} onWhatsapp={whatsapp} onRemark={submitRemark} loading={loading} saving={saving} moreAvailable={visible < (tab === "calling" ? data.totals?.callingData ?? 0 : data.totals?.queue ?? 0)} onLoadMore={() => setVisible((value) => value + 12)} />}
      </motion.section></AnimatePresence>

      <section className={`${surface} p-5`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">Recent Activity</p><h2 className="mt-1 text-lg font-semibold">Your live executive timeline</h2></div><ArrowRight className="h-5 w-5 text-slate-500" /></div><div className="mt-5 grid gap-3 md:grid-cols-3"><Activity title="Priority queue" body={`${today.length} lead${today.length === 1 ? "" : "s"} available for today.`} /><Activity title="Manual calling" body={`${calling.length} uploaded calling-data lead${calling.length === 1 ? "" : "s"} available.`} /><Activity title="Qualified workspace" body={`${workspaceLeads.length} interested lead${workspaceLeads.length === 1 ? "" : "s"} in your workspace.`} /></div></section>
    </div>
    <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: 16, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border border-cyan-300/20 bg-[#0d1830]/95 px-4 py-3 text-sm text-cyan-50 shadow-2xl shadow-cyan-500/15 backdrop-blur-xl">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification" className="rounded-xl p-1 hover:bg-white/10"><X className="h-4 w-4" /></button></motion.div>}</AnimatePresence>
  </main>;
}

function MiniDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) { return <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] px-4 py-3"><span className="text-cyan-200">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{label}</p><p className="truncate text-sm font-medium text-slate-200">{value}</p></div></div>; }
function Metric({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string | number; accent: string }) { const color: Record<string, string> = { cyan: "from-cyan-300/18 text-cyan-100", emerald: "from-emerald-300/18 text-emerald-100", blue: "from-blue-300/18 text-blue-100", amber: "from-amber-300/18 text-amber-100", violet: "from-violet-300/18 text-violet-100", indigo: "from-indigo-300/18 text-indigo-100" }; return <motion.div whileHover={{ y: -3 }} className={`${surface} min-h-[116px] p-4`}><div className={`absolute inset-0 bg-gradient-to-br ${color[accent]} to-transparent opacity-60`} /><div className="relative flex items-start justify-between"><p className="max-w-[90px] text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">{label}</p><span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.08] bg-white/[.045]">{icon}</span></div><p className="relative mt-4 text-2xl font-semibold tracking-tight">{value}</p><div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full w-2/3 rounded-full bg-white/30" /></div></motion.div>; }
function Activity({ title, body }: { title: string; body: string }) { return <div className="flex gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" /><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm leading-5 text-slate-400">{body}</p></div></div>; }

function LeadCollection({ title, subtitle, leads, query, onQuery, onCall, onWhatsapp, onRemark, loading, saving, moreAvailable, onLoadMore }: { title: string; subtitle: string; leads: Lead[]; query: string; onQuery: (value: string) => void; onCall: (lead: Lead) => Promise<void>; onWhatsapp: (lead: Lead) => void; onRemark: (lead: Lead, value: Remark) => void; loading: boolean; saving: boolean; moreAvailable: boolean; onLoadMore: () => void }) {
  const [remarkSelections, setRemarkSelections] = useState<Record<string, Remark | "">>(() =>
    Object.fromEntries(leads.map((lead) => [lead.id, ""]))
  );

  useEffect(() => {
    setRemarkSelections(Object.fromEntries(leads.map((lead) => [lead.id, ""])));
  }, [leads]);

  return <div><div className="flex flex-col gap-4 border-b border-white/[.07] pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-200">Executive outreach</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div><div className="relative w-full lg:w-80"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search assigned leads" className="w-full rounded-2xl border border-white/[.09] bg-black/15 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-300/35 focus:bg-white/[.045] focus:ring-4 focus:ring-cyan-400/[.06]" /></div></div>{loading ? <Loading /> : <div className="mt-4 grid gap-3 xl:grid-cols-2">{leads.length ? leads.map((lead, index) => {
      const selectedRemark = remarkSelections[lead.id] ?? "";
      return <motion.article key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .025 }} whileHover={{ y: -3 }} className="group rounded-3xl border border-white/[.08] bg-white/[.025] p-4 shadow-[0_14px_38px_-30px_rgba(0,0,0,.9)] transition hover:border-cyan-200/20 hover:bg-white/[.045]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Assigned lead · {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 truncate text-base font-semibold">{lead.name}</h3><p className="mt-1 text-sm text-slate-400">{lead.mobile || "No number"}</p><p className="mt-1 truncate text-sm text-slate-500">{lead.project}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge(lead.remark || lead.status)}`}>{label(lead.remark || lead.status)}</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><button onClick={() => onCall(lead)} className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-400 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-[0_11px_24px_-15px_rgba(34,211,238,.95)] transition hover:brightness-110"><Phone className="h-3.5 w-3.5" />Call</button><button onClick={() => onWhatsapp(lead)} className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.08] px-3 py-2.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/[.14]"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button><select value={selectedRemark} onChange={(event) => setRemarkSelections((current) => ({ ...current, [lead.id]: event.target.value as Remark | "" }))} disabled={saving} aria-label={`Remark for ${lead.name}`} className="min-w-0 rounded-2xl border border-white/[.08] bg-black/15 px-2 text-xs outline-none focus:border-cyan-300/35"><option value="">Remark</option>{remarkOptions.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select><button onClick={() => selectedRemark && onRemark(lead, selectedRemark as Remark)} disabled={saving || !selectedRemark} className="rounded-2xl border border-white/[.09] bg-white/[.055] px-3 py-2.5 text-xs font-semibold transition hover:bg-white/[.1]">Submit</button></div></motion.article>}) : <Empty title="No leads ready" body="New assignments will appear here as soon as they are available." />}</div>}{moreAvailable && !loading && <div className="mt-5 text-center"><button onClick={onLoadMore} className={buttonBase}>Load more leads <ChevronRight className="h-4 w-4" /></button></div>}</div>;
}

function AutocallerPlaceholder() { return <div className="relative overflow-hidden rounded-3xl border border-dashed border-cyan-200/20 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.1),transparent_42%)] px-5 py-12 text-center sm:p-14"><motion.div animate={{ scale: [1, 1.06, 1], opacity: [.65, 1, .65] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto grid h-20 w-20 place-items-center rounded-[29px] border border-cyan-200/20 bg-cyan-300/[.09] text-cyan-100 shadow-[0_0_55px_-18px_rgba(34,211,238,.8)]"><Headphones className="h-9 w-9" /></motion.div><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[.08] px-3 py-1 text-xs font-semibold text-amber-100">Coming soon</div><h2 className="mt-3 text-2xl font-semibold">Autocaller control room</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Automatic dialling will appear here when it is enabled for your organisation. Your manual calling data remains available in the Calling Data module.</p><div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">{["Queue routing", "Automatic dialling", "Live dispositions"].map((item) => <div key={item} className="rounded-2xl border border-white/[.07] bg-white/[.035] px-4 py-4 text-left"><p className="text-xs font-semibold text-slate-300">{item}</p><p className="mt-1 text-xs text-slate-500">Unavailable</p></div>)}</div></div>; }

function WorkspacePanel({ rows, selected, saving, search, onSearch, onToggle, onSelectAll, onAdd, onExport, onUpload, onDeleteSelected, onDeleteAll, onUpdate, onSave, onWhatsapp, selectedCount }: { rows: Lead[]; selected: string[]; saving: boolean; search: string; onSearch: (value: string) => void; onToggle: (id: string) => void; onSelectAll: () => void; onAdd: () => void; onExport: () => void; onUpload: () => void; onDeleteSelected: () => void; onDeleteAll: () => void; onUpdate: (id: string, key: keyof Omit<Lead, "id" | "source">, value: string) => void; onSave: (lead: Lead) => void; onWhatsapp: (lead: Lead) => void; selectedCount: number }) {
  return <div><div className="flex flex-col gap-4 border-b border-white/[.07] pb-5 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-200">Relationship workspace</p><h2 className="mt-1 text-xl font-semibold">Qualified leads & follow-ups</h2><p className="mt-1 text-sm text-slate-400">Update outcomes, notes and next steps without losing your working context.</p></div><div className="flex flex-wrap gap-2"><button onClick={onAdd} className={buttonBase}><Sparkles className="h-4 w-4" />Add</button><button onClick={onExport} className={buttonBase}><Download className="h-4 w-4" />Export</button><button onClick={onUpload} className={buttonBase}><Upload className="h-4 w-4" />Upload</button></div></div><div className="mt-4 flex flex-col gap-3 rounded-3xl border border-white/[.07] bg-white/[.025] p-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={onSelectAll} className={buttonBase}>Select all</button><button onClick={onDeleteSelected} disabled={!selectedCount} className={`${buttonBase} text-rose-100 hover:border-rose-300/25`}><Trash2 className="h-4 w-4" />Delete selected{selectedCount ? ` (${selectedCount})` : ""}</button><button onClick={onDeleteAll} className={`${buttonBase} text-rose-100 hover:border-rose-300/25`}><Trash2 className="h-4 w-4" />Delete all</button></div><div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search workspace" className="w-full rounded-2xl border border-white/[.09] bg-black/15 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-300/35" /></div></div><div className="mt-4 space-y-3 lg:hidden">{rows.length ? rows.map((lead) => <WorkspaceCard key={lead.id} lead={lead} selected={selected.includes(lead.id)} saving={saving} onToggle={onToggle} onUpdate={onUpdate} onSave={onSave} onWhatsapp={onWhatsapp} />) : <Empty title="No workspace leads" body="Interested leads and saved follow-ups will appear here." />}</div><div className="mt-4 hidden overflow-hidden rounded-3xl border border-white/[.07] lg:block"><div className="overflow-x-auto"><table className="w-full min-w-[950px] border-separate border-spacing-0 text-left"><thead className="bg-white/[.045] text-[10px] uppercase tracking-[.17em] text-slate-500"><tr><th className="w-12 px-4 py-4">#</th><th className="px-4 py-4">Lead</th><th className="px-4 py-4">Project</th><th className="px-4 py-4">Remark & notes</th><th className="px-4 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/[.06]">{rows.length ? rows.map((lead) => <tr key={lead.id} className="bg-[#091227]/45 transition hover:bg-white/[.04]"><td className="px-4 py-4"><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => onToggle(lead.id)} className="h-4 w-4 accent-cyan-300" /></td><td className="px-4 py-4"><p className="font-medium">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{lead.mobile || "No phone"}</p></td><td className="px-4 py-4 text-sm text-slate-300">{lead.project}</td><td className="min-w-[340px] px-4 py-3"><div className="flex gap-2"><select value={lead.remark} onChange={(event) => onUpdate(lead.id, "remark", event.target.value)} className="w-40 rounded-xl border border-white/[.08] bg-black/15 px-2 py-2 text-xs outline-none"><option value="">Remark</option>{remarkOptions.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select><input value={lead.notes} placeholder="Notes" onChange={(event) => onUpdate(lead.id, "notes", event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-black/15 px-3 py-2 text-xs outline-none" /></div></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => onWhatsapp(lead)} className={buttonBase}><MessageCircle className="h-4 w-4" /></button><button onClick={() => onSave(lead)} disabled={saving} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-200">Save</button></div></td></tr>) : <tr><td colSpan={5} className="p-10"><Empty title="No workspace leads" body="Interested leads and saved follow-ups will appear here." /></td></tr>}</tbody></table></div></div></div>;
}
function WorkspaceCard({ lead, selected, saving, onToggle, onUpdate, onSave, onWhatsapp }: { lead: Lead; selected: boolean; saving: boolean; onToggle: (id: string) => void; onUpdate: (id: string, key: keyof Omit<Lead, "id" | "source">, value: string) => void; onSave: (lead: Lead) => void; onWhatsapp: (lead: Lead) => void }) { return <article className="rounded-3xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-start gap-3"><input type="checkbox" checked={selected} onChange={() => onToggle(lead.id)} className="mt-1 h-4 w-4 accent-cyan-300" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{lead.name}</p><p className="mt-1 text-xs text-slate-400">{lead.mobile} · {lead.project}</p></div></div><div className="mt-4 grid gap-2"><select value={lead.remark} onChange={(event) => onUpdate(lead.id, "remark", event.target.value)} className="rounded-2xl border border-white/[.08] bg-black/15 px-3 py-2.5 text-sm outline-none"><option value="">Select remark</option>{remarkOptions.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select><input value={lead.notes} placeholder="Notes" onChange={(event) => onUpdate(lead.id, "notes", event.target.value)} className="rounded-2xl border border-white/[.08] bg-black/15 px-3 py-2.5 text-sm outline-none" /></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => onWhatsapp(lead)} className={buttonBase}><MessageCircle className="h-4 w-4" />WhatsApp</button><button onClick={() => onSave(lead)} disabled={saving} className="rounded-2xl bg-cyan-300 px-3 py-2.5 text-sm font-bold text-slate-950">Save</button></div></article>; }
function Empty({ title, body }: { title: string; body: string }) { return <div className="rounded-3xl border border-dashed border-white/[.1] bg-white/[.02] p-10 text-center"><UsersRound className="mx-auto h-8 w-8 text-cyan-200/75" /><p className="mt-3 font-semibold">{title}</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{body}</p></div>; }
function Loading() { return <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-3xl border border-white/[.05] bg-white/[.035]" />)}</div>; }
