"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Download, FileSpreadsheet, Loader2, RefreshCw, Send, Sparkles, Upload, UsersRound, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

type Choice = { id: string; label: string };
type Assignment = "ROUND_ROBIN" | "TEAM_ROUND_ROBIN" | "EXECUTIVE" | "UNASSIGNED";
type Queue = "TODAY_LEADS" | "CALLING_DATA" | "AUTOCALLER";

const modes: { id: Assignment; title: string; detail: string }[] = [
  { id: "ROUND_ROBIN", title: "Auto assign equally", detail: "Divide every imported lead equally among all active executives." },
  { id: "TEAM_ROUND_ROBIN", title: "Auto assign to a team", detail: "Divide leads equally among executives in one selected team." },
  { id: "EXECUTIVE", title: "Manual bulk assignment", detail: "Assign the complete upload to one named executive." },
  { id: "UNASSIGNED", title: "Keep unassigned", detail: "Import safely without assigning an owner." },
];
const queues: { id: Queue; title: string; detail: string }[] = [
  { id: "TODAY_LEADS", title: "Today’s Leads", detail: "Manual follow-up queue" },
  { id: "CALLING_DATA", title: "Calling Data", detail: "Manual calling workspace" },
  { id: "AUTOCALLER", title: "Autocaller", detail: "Automatic dialer queue" },
];

function list(data: unknown): Record<string, unknown>[] { if (Array.isArray(data)) return data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object"); if (data && typeof data === "object") { const object = data as Record<string, unknown>; return Array.isArray(object.data) ? list(object.data) : Array.isArray(object.users) ? list(object.users) : Array.isArray(object.teams) ? list(object.teams) : []; } return []; }
function value(input: unknown): string { return typeof input === "string" ? input : typeof input === "number" ? String(input) : ""; }

export default function UploadLeadsPage() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [executives, setExecutives] = useState<Choice[]>([]);
  const [teams, setTeams] = useState<Choice[]>([]);
  const [mode, setMode] = useState<Assignment>("ROUND_ROBIN");
  const [queue, setQueue] = useState<Queue>("TODAY_LEADS");
  const [executive, setExecutive] = useState("");
  const [team, setTeam] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const refreshPeople = async () => {
    const [usersResult, teamsResult] = await Promise.allSettled([fetch("/api/admin/users", { credentials: "include" }), fetch("/api/admin/teams", { credentials: "include" })]);
    if (usersResult.status === "fulfilled" && usersResult.value.ok) { const users = list(await usersResult.value.json()); setExecutives(users.filter((user) => value(user.role).toUpperCase() === "EXECUTIVE").map((user) => ({ id: value(user.id), label: value(user.username ?? user.name ?? user.email) })).filter((user) => user.id)); }
    if (teamsResult.status === "fulfilled" && teamsResult.value.ok) { const result = list(await teamsResult.value.json()); setTeams(result.map((item) => ({ id: value(item.id), label: value(item.name ?? item.label) })).filter((item) => item.id)); }
  };
  useEffect(() => { void refreshPeople(); }, []);
  useEffect(() => { if (executive) setMode("EXECUTIVE"); }, [executive]);
  useEffect(() => { if (team) setMode("TEAM_ROUND_ROBIN"); }, [team]);
  const handleSetExecutive = (value: string) => {
    setExecutive(value);
    if (value) setMode("EXECUTIVE");
  };

  const handleSetTeam = (value: string) => {
    setTeam(value);
    if (value) setMode("TEAM_ROUND_ROBIN");
  };
  const changeFile = (event: ChangeEvent<HTMLInputElement>) => { setFile(event.target.files?.[0] ?? null); setNotice(null); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) { setNotice({ tone: "error", message: "Choose a CSV or Excel file first." }); return; }
    if (mode === "EXECUTIVE" && !executive) { setNotice({ tone: "error", message: "Choose the executive who should receive these leads." }); return; }
    if (mode === "TEAM_ROUND_ROBIN" && !team) { setNotice({ tone: "error", message: "Choose the team that should receive these leads." }); return; }
    setLoading(true); setNotice(null);
    try {
      const form = new FormData();
      form.append("file", file); form.append("assignmentMode", mode); form.append("distributionMode", mode); form.append("destinationQueue", queue); form.append("executiveQueue", queue); if (source) { form.append("source", source); form.append("uploadSource", source); } if (executive) { form.append("assignedToId", executive); form.append("executiveId", executive); } if (team) form.append("teamId", team);
      const response = await fetch("/api/admin/upload", { method: "POST", credentials: "include", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = result?.message || result?.error || "Upload failed";
        throw new Error(errorMessage);
      }
      setNotice({ tone: "success", message: `Imported ${value(result?.created) || "your"} leads. They are ready in ${queues.find((item) => item.id === queue)?.title}.` }); setFile(null); if (input.current) input.current.value = "";
    } catch (error) { 
      const msg = error instanceof Error ? error.message : "Upload failed.";
      console.error("Upload error:", msg);
      setNotice({ tone: "error", message: msg }); 
    }
    finally { setLoading(false); }
  };

  return <DashboardLayout><main className="relative min-h-screen overflow-x-hidden bg-[#050816] px-4 py-5 text-slate-100 sm:px-6 lg:px-8"><div className="pointer-events-none fixed inset-0 overflow-hidden"><motion.div animate={{ x: [0, 80, 0], y: [0, -45, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/[.14] blur-[170px]" /><motion.div animate={{ x: [0, -70, 0], y: [0, 55, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-40 top-1/3 h-[540px] w-[540px] rounded-full bg-violet-600/[.13] blur-[180px]" /></div><div className="relative mx-auto max-w-[1500px] space-y-5"><header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">Lead distribution studio</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Upload & assign leads</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Import a bulk file, choose the executive queue, and distribute leads intelligently in one controlled workflow.</p></div><button onClick={() => void refreshPeople()} className="inline-flex items-center gap-2 self-start rounded-xl border border-white/[.1] bg-white/[.04] px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[.08]"><RefreshCw className="h-4 w-4" />Refresh people</button></header><form onSubmit={submit} className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><aside className="space-y-5"><section className="overflow-hidden rounded-[28px] border border-cyan-300/15 bg-slate-950/70 p-5 shadow-[0_28px_80px_-45px_rgba(34,211,238,.6)] backdrop-blur-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" />Smart assignment</span><h2 className="mt-4 text-xl font-bold">Import with confidence</h2><div className="mt-5 space-y-3 text-sm text-slate-400"><p>Accepts <b className="text-slate-200">CSV, XLS and XLSX</b>.</p><p>Required: <b className="text-slate-200">Name</b> and <b className="text-slate-200">Mobile</b>.</p><p>Optional: project, city, source, status, remark, notes, follow-up date and assigned executive.</p></div><a href="/sample_leads.csv" download className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-cyan-200 hover:text-white"><Download className="h-4 w-4" />Download sample file</a></section><section className="rounded-[28px] border border-white/[.1] bg-white/[.035] p-5 backdrop-blur-xl"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">Executive dashboard routing</p><p className="mt-2 text-sm text-slate-300">The selected queue is sent with the existing import request so assigned executives see the correct work type.</p><div className="mt-4 space-y-2">{queues.map((item) => <label key={item.id} className={`block cursor-pointer rounded-2xl border p-3 transition ${queue === item.id ? "border-cyan-300/40 bg-cyan-300/[.1]" : "border-white/[.08] bg-slate-950/40"}`}><input type="radio" className="sr-only" checked={queue === item.id} onChange={() => setQueue(item.id)} /><span className="flex items-center gap-3"><Send className="h-4 w-4 text-cyan-200" /><span><b className="block text-xs text-white">{item.title}</b><small className="text-[11px] text-slate-400">{item.detail}</small></span></span></label>)}</div></section></aside><section className="rounded-[30px] border border-white/[.1] bg-slate-950/70 p-5 shadow-[0_28px_88px_-42px_rgba(0,0,0,.92)] backdrop-blur-2xl sm:p-6"><input ref={input} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={changeFile} /><button type="button" onClick={() => input.current?.click()} className="grid w-full place-items-center rounded-[24px] border border-dashed border-cyan-300/30 bg-cyan-300/[.035] px-5 py-10 text-center transition hover:border-cyan-200/60 hover:bg-cyan-300/[.07]"><FileSpreadsheet className="h-9 w-9 text-cyan-200" /><b className="mt-4 text-base">{file ? file.name : "Drop your lead file here"}</b><span className="mt-1 text-xs text-slate-400">Click to select CSV, XLS or XLSX</span></button><div className="mt-6"><p className="text-sm font-semibold">How should these leads be assigned?</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{modes.map((item) => <label key={item.id} className={`cursor-pointer rounded-2xl border p-4 transition ${mode === item.id ? "border-cyan-300/40 bg-cyan-300/[.09] shadow-[0_0_28px_rgba(34,211,238,.08)]" : "border-white/[.08] bg-white/[.025] hover:bg-white/[.05]"}`}><input type="radio" className="sr-only" checked={mode === item.id} onChange={() => setMode(item.id)} /><span className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-lg ${mode === item.id ? "bg-cyan-300 text-slate-950" : "bg-white/[.06] text-slate-400"}`}>{item.id === "EXECUTIVE" ? <UsersRound className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span><span><b className="block text-xs text-white">{item.title}</b><small className="mt-1 block text-[11px] leading-4 text-slate-400">{item.detail}</small></span></span></label>)}</div></div>{mode === "TEAM_ROUND_ROBIN" && <Select label="Selected team" value={team} setValue={setTeam} choices={teams} placeholder="Choose a team" />}{mode === "EXECUTIVE" && <Select label="Assign to executive" value={executive} setValue={setExecutive} choices={executives} placeholder="Choose an executive" />}{mode === "UNASSIGNED" && <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.07] px-3 py-2.5 text-xs text-amber-100">Leads will be imported without an owner and can be assigned later from Leads.</p>}<div className="mt-5"><label className="mb-2 block text-xs font-semibold text-slate-300">Lead source <span className="font-normal text-slate-500">(optional)</span></label><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Example: Meta Campaign July" className="w-full rounded-xl border border-white/[.1] bg-slate-950 px-3 py-3 text-sm outline-none transition focus:border-cyan-300/40" /></div><AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.tone === "error" ? "border-rose-400/20 bg-rose-500/10 text-rose-100" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"}`}><CheckCircle2 className="h-4 w-4 shrink-0" /><span className="flex-1">{notice.message}</span><button type="button" onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></motion.div>}</AnimatePresence><button disabled={loading || !file} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_12px_35px_rgba(34,211,238,.22)] transition hover:brightness-110 disabled:opacity-40">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{loading ? "Importing leads…" : "Import & distribute leads"}<ArrowRight className="h-4 w-4" /></button></section></form></div></main></DashboardLayout>;
}

function Select({ label, value, setValue, choices, placeholder }: { label: string; value: string; setValue: (value: string) => void; choices: Choice[]; placeholder: string }) { return <div className="mt-5"><label className="mb-2 block text-xs font-semibold text-slate-300">{label}</label><select value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-xl border border-white/[.1] bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-300/40"><option value="">{placeholder}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>; }
