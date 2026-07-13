"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Filter,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

type LeadStatus = "NEW" | "CALLED" | "INTERESTED" | "FOLLOW_UP" | "SITE_VISIT" | "NEGOTIATION" | "BOOKED" | "LOST";
type LeadRemark = "INTERESTED" | "NOT_INTERESTED" | "BUSY" | "SWITCH_OFF" | "WRONG_NUMBER" | "CALLBACK" | "NO_ANSWER" | "SITE_VISIT" | "BOOKED" | "LOST";

interface LeadActivity {
  id?: string;
  type?: string;
  description?: string;
  createdAt?: string;
}

interface Lead {
  id: string;
  name: string;
  mobile: string;
  project: string | null;
  city: string | null;
  source: string | null;
  status: LeadStatus;
  remark: LeadRemark | null;
  notes: string | null;
  followUpDate: string | null;
  assignedToId: string | null;
  assignedTo?: { username?: string; name?: string } | null;
  updatedAt?: string | null;
  activities?: LeadActivity[];
}

interface LeadResponse {
  leads?: Lead[];
  data?: Lead[];
}

interface Draft {
  status: LeadStatus;
  remark: LeadRemark | "";
  followUpDate: string;
  notes: string;
}

const statuses: LeadStatus[] = ["NEW", "CALLED", "INTERESTED", "FOLLOW_UP", "SITE_VISIT", "NEGOTIATION", "BOOKED", "LOST"];
const remarks: LeadRemark[] = ["INTERESTED", "NOT_INTERESTED", "BUSY", "SWITCH_OFF", "WRONG_NUMBER", "CALLBACK", "NO_ANSWER", "SITE_VISIT", "BOOKED", "LOST"];

const statusStyle: Record<LeadStatus, string> = {
  NEW: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  CALLED: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  INTERESTED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FOLLOW_UP: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  SITE_VISIT: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  NEGOTIATION: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  BOOKED: "border-green-400/20 bg-green-400/10 text-green-300",
  LOST: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const controlClass = "h-10 w-full rounded-xl border border-white/10 bg-[#111a30] px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10";

function text(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function displayDate(value: string | null | undefined) {
  if (!value) return "No activity yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function createDraft(lead: Lead): Draft {
  return { status: lead.status, remark: lead.remark ?? "", followUpDate: dateValue(lead.followUpDate), notes: lead.notes ?? "" };
}

function whatsapp(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

export default function CallingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [remarkFilter, setRemarkFilter] = useState<LeadRemark | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const payload: Lead[] | LeadResponse = await response.json();
      if (!response.ok) throw new Error("Unable to load your calling queue.");
      const nextLeads = Array.isArray(payload) ? payload : payload.leads ?? payload.data ?? [];
      setLeads(nextLeads);
      setDrafts(Object.fromEntries(nextLeads.map((lead) => [lead.id, createDraft(lead)])));
      setSelectedId((current) => current && nextLeads.some((lead) => lead.id === current) ? current : nextLeads[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your calling queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeads(); }, [loadLeads]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredLeads = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesTerm = !term || [lead.name, lead.mobile, lead.project, lead.city, lead.source].filter(Boolean).some((value) => value?.toLowerCase().includes(term));
      return matchesTerm && (statusFilter === "ALL" || lead.status === statusFilter) && (remarkFilter === "ALL" || lead.remark === remarkFilter);
    });
  }, [leads, query, remarkFilter, statusFilter]);

  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? null;
  const selectedDraft = selectedLead ? drafts[selectedLead.id] ?? createDraft(selectedLead) : null;
  const today = new Date().toISOString().slice(0, 10);
  const metrics = useMemo(() => ({
    today: leads.filter((lead) => dateValue(lead.followUpDate) === today).length,
    followUp: leads.filter((lead) => lead.status === "FOLLOW_UP" || Boolean(lead.followUpDate)).length,
    interested: leads.filter((lead) => lead.status === "INTERESTED" || lead.remark === "INTERESTED").length,
    booked: leads.filter((lead) => lead.status === "BOOKED" || lead.remark === "BOOKED").length,
  }), [leads, today]);

  const setDraft = (field: keyof Draft, value: string) => {
    if (!selectedLead) return;
    setDrafts((current) => {
      const next = { ...(current[selectedLead.id] ?? createDraft(selectedLead)), [field]: value } as Draft;
      if ((field === "status" && value === "FOLLOW_UP") || (field === "remark" && value === "CALLBACK")) {
        if (!next.followUpDate) next.followUpDate = tomorrow();
      }
      return { ...current, [selectedLead.id]: next };
    });
  };

  const saveLead = async () => {
    if (!selectedLead || !selectedDraft) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/executive/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          status: selectedDraft.status,
          remark: selectedDraft.remark || null,
          followUpDate: selectedDraft.followUpDate ? new Date(`${selectedDraft.followUpDate}T00:00:00`).toISOString() : null,
          notes: selectedDraft.notes.trim() || null,
        }),
      });
      const result = await response.json().catch(() => null) as Lead | { lead?: Lead } | null;
      if (!response.ok) throw new Error("The lead update could not be saved.");
      const returnedLead = result && "lead" in result ? result.lead : result;
      const updated = returnedLead && "id" in returnedLead ? returnedLead : { ...selectedLead, status: selectedDraft.status, remark: selectedDraft.remark || null, followUpDate: selectedDraft.followUpDate || null, notes: selectedDraft.notes || null };
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setDrafts((current) => ({ ...current, [updated.id]: createDraft(updated) }));
      setToast("Lead details saved successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The lead update could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const chooseLead = (id: string) => {
    setSelectedId(id);
    setMobileDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-[#060b18] px-4 py-5 text-white sm:px-6 lg:px-7">
        <div className="mx-auto max-w-[1800px]">
          <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">ORVION CRM</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Calling Desk</h1><p className="mt-1 text-sm text-slate-400">Today&apos;s calling dashboard.</p></div>
            <div className="flex w-full items-center gap-2 sm:w-auto"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:w-72"><Search className="h-4 w-4 shrink-0 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</label><button type="button" onClick={() => void loadLeads()} disabled={loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button type="button" onClick={() => setFiltersOpen((current) => !current)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${filtersOpen ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`} aria-label="Filters"><Filter className="h-4 w-4" /></button></div>
          </header>

          {filtersOpen && <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0d1529] p-3"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "ALL")} className="h-9 rounded-lg border border-white/10 bg-[#121c33] px-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50"><option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{text(status)}</option>)}</select><select value={remarkFilter} onChange={(event) => setRemarkFilter(event.target.value as LeadRemark | "ALL")} className="h-9 rounded-lg border border-white/10 bg-[#121c33] px-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50"><option value="ALL">All remarks</option>{remarks.map((remark) => <option key={remark} value={remark}>{text(remark)}</option>)}</select><button type="button" onClick={() => { setStatusFilter("ALL"); setRemarkFilter("ALL"); }} className="h-9 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/[0.06] hover:text-white">Clear filters</button></div>}

          <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat title="Today’s Calls" value={metrics.today} icon={<Phone className="h-4 w-4" />} tone="cyan" /><Stat title="Pending Follow Ups" value={metrics.followUp} icon={<CalendarClock className="h-4 w-4" />} tone="amber" /><Stat title="Interested" value={metrics.interested} icon={<Users className="h-4 w-4" />} tone="emerald" /><Stat title="Booked" value={metrics.booked} icon={<CheckCircle2 className="h-4 w-4" />} tone="violet" /></section>

          {error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span className="flex items-center gap-2"><CircleAlert className="h-4 w-4" />{error}</span><button type="button" onClick={() => void loadLeads()} className="font-medium hover:text-white">Retry</button></div>}

          <section className="relative grid min-h-[calc(100vh-270px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1022]/90 shadow-[0_20px_70px_rgba(0,0,0,0.3)] lg:grid-cols-[minmax(360px,40%)_minmax(0,60%)]">
            <aside className="min-h-0 border-r border-white/10 bg-[#0b1326]/70 lg:block">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h2 className="font-semibold">Lead Queue</h2><p className="mt-0.5 text-xs text-slate-500">{filteredLeads.length} active leads</p></div><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-300">Live</span></div>
              <div className="h-[calc(100vh-360px)] min-h-[440px] overflow-y-auto p-3">
                {loading ? <QueueSkeleton /> : filteredLeads.length === 0 ? <div className="grid h-full place-items-center text-center"><div><Users className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">No leads found</p><p className="mt-1 text-xs text-slate-500">Change filters or refresh the queue.</p></div></div> : <div className="space-y-2">{filteredLeads.map((lead) => <LeadCard key={lead.id} lead={lead} active={lead.id === selectedId} onClick={() => chooseLead(lead.id)} />)}</div>}
              </div>
            </aside>

            <section className={`absolute inset-y-0 right-0 z-20 w-full overflow-y-auto bg-[#0a1022] transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 ${mobileDetailsOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="lg:hidden flex h-14 items-center gap-3 border-b border-white/10 px-4"><button type="button" onClick={() => setMobileDetailsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300" aria-label="Back to queue"><ChevronLeft className="h-4 w-4" /></button><span className="font-semibold">Lead Details</span></div>
              {selectedLead && selectedDraft ? <Details lead={selectedLead} draft={selectedDraft} saving={saving} onDraftChange={setDraft} onSave={() => void saveLead()} /> : <div className="grid h-full min-h-[500px] place-items-center p-6 text-center"><div><Users className="mx-auto h-9 w-9 text-slate-600" /><h2 className="mt-3 font-semibold text-slate-300">Select a lead</h2><p className="mt-1 text-sm text-slate-500">Choose a lead from the queue to view their calling details.</p></div></div>}
            </section>
          </section>
        </div>
        {toast && <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#0c201c] px-4 py-3 text-sm text-emerald-200 shadow-2xl"><CheckCircle2 className="h-4 w-4" />{toast}</div>}
      </main>
    </DashboardLayout>
  );
}

function Stat({ title, value, icon, tone }: { title: string; value: number; icon: ReactNode; tone: "cyan" | "amber" | "emerald" | "violet" }) {
  const tones = { cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300", amber: "border-amber-400/20 bg-amber-400/10 text-amber-300", emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", violet: "border-violet-400/20 bg-violet-400/10 text-violet-300" };
  return <article className="flex h-[94px] items-center justify-between rounded-2xl border border-white/10 bg-[#0a1022]/90 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"><div><p className="text-xs text-slate-400">{title}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl border ${tones[tone]}`}>{icon}</span></article>;
}

function LeadCard({ lead, active, onClick }: { lead: Lead; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-cyan-400/45 bg-cyan-400/[0.09] shadow-[0_8px_24px_rgba(34,211,238,0.08)]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{lead.name}</p><p className="mt-0.5 text-xs text-slate-400">{lead.mobile}</p></div><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[lead.status]}`}>{text(lead.status)}</span></div><div className="mt-3 flex items-end justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs text-slate-300">{lead.project || "No project specified"}</p><p className="mt-0.5 text-[11px] text-slate-500">{lead.city || "City not specified"} · {displayDate(lead.updatedAt)}</p></div><div className="flex shrink-0 gap-1"><a href={`tel:${lead.mobile}`} onClick={(event) => event.stopPropagation()} className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20" aria-label={`Call ${lead.name}`}><Phone className="h-3.5 w-3.5" /></a><a href={whatsapp(lead.mobile)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20" aria-label={`Message ${lead.name}`}><MessageCircle className="h-3.5 w-3.5" /></a></div></div></button>;
}

function Details({ lead, draft, saving, onDraftChange, onSave }: { lead: Lead; draft: Draft; saving: boolean; onDraftChange: (field: keyof Draft, value: string) => void; onSave: () => void }) {
  const activities = [...(lead.activities ?? [])].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  return <div className="p-4 sm:p-5"><div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Lead profile</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{lead.name}</h2><p className="mt-1 text-sm text-slate-400">{lead.mobile}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[draft.status]}`}>{text(draft.status)}</span></div><dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-b border-white/10 py-5 text-sm sm:grid-cols-3"><Info label="Project" value={lead.project} /><Info label="City" value={lead.city} /><Info label="Lead Source" value={lead.source} /><Info label="Assigned Executive" value={lead.assignedTo?.name || lead.assignedTo?.username || lead.assignedToId} /><Info label="Last Updated" value={displayDate(lead.updatedAt)} /><Info label="Follow Up" value={draft.followUpDate || "Not scheduled"} /></dl><div className="grid grid-cols-2 gap-2 py-5"><a href={`tel:${lead.mobile}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 text-sm font-bold text-[#06101b] shadow-[0_10px_24px_rgba(34,211,238,0.16)] transition hover:brightness-110"><Phone className="h-4 w-4" />Call</a><a href={whatsapp(lead.mobile)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"><MessageCircle className="h-4 w-4" />WhatsApp</a></div><div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2"><Field label="Status"><select value={draft.status} onChange={(event) => onDraftChange("status", event.target.value)} className={controlClass}>{statuses.map((status) => <option key={status} value={status}>{text(status)}</option>)}</select></Field><Field label="Remark"><select value={draft.remark} onChange={(event) => onDraftChange("remark", event.target.value)} className={controlClass}><option value="">Select remark</option>{remarks.map((remark) => <option key={remark} value={remark}>{text(remark)}</option>)}</select></Field><Field label="Follow Up Date"><input type="date" value={draft.followUpDate} onChange={(event) => onDraftChange("followUpDate", event.target.value)} className={`${controlClass} [color-scheme:dark]`} /></Field><div className="hidden sm:block" /><Field label="Notes" wide><textarea value={draft.notes} onChange={(event) => onDraftChange("notes", event.target.value)} rows={3} placeholder="Record the outcome of this conversation" className={`${controlClass} h-auto resize-none py-2.5`} /></Field></div><button type="button" onClick={onSave} disabled={saving} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 text-sm font-bold text-[#06101b] shadow-[0_10px_26px_rgba(34,211,238,0.15)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Saving changes" : "Save Changes"}</button><section className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Timeline</h3><p className="mt-0.5 text-xs text-slate-500">Newest activity first</p></div><Clock3 className="h-4 w-4 text-slate-500" /></div><div className="mt-4 space-y-4">{activities.length ? activities.map((activity, index) => <div key={activity.id ?? index} className="relative pl-6 before:absolute before:left-1.5 before:top-5 before:h-[calc(100%+14px)] before:w-px before:bg-white/10 last:before:hidden"><span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[#0a1022] bg-cyan-400" /><p className="text-sm text-slate-200">{activity.description || activity.type || "Lead activity updated"}</p><p className="mt-1 text-xs text-slate-500">{displayDate(activity.createdAt)}</p></div>) : <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-slate-400">No activity history is available for this lead yet.</div>}</div></section></div>;
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 truncate text-sm text-slate-200">{value || "—"}</dd></div>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
}

function QueueSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.035]" />)}</div>;
}
