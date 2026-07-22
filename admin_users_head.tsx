"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, BarChart3, BriefcaseBusiness, CalendarClock, Check, ChevronLeft, ChevronRight,
  CircleAlert, Clock3, Download, Edit3, Mail, MessageCircle, MoreHorizontal,
  Phone, Plus, RefreshCw, Search, Send, ShieldAlert, Trash2, UserCog, UserPlus, Users, X,
  Zap,
} from "lucide-react";

type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
type Presence = "ONLINE" | "OFFLINE" | "ON_CALL" | "IDLE" | "BREAK" | "BUSY" | string;
type User = {
  id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null;
  role: string; department?: string | null; team?: string | null; campaign?: string | null;
  employeeId?: string | null; shift?: string | null; status: Status; presence?: Presence;
  assignedLeads?: number; completedCalls?: number; interested?: number; booked?: number;
  conversion?: number; performance?: number; averageCallDuration?: string | number;
  todayCalls?: number; lastLogin?: string | null; joinedAt?: string | null;
  activities?: { id: string; type: string; detail: string; createdAt: string }[];
  callHistory?: { id: string; contact?: string; duration?: string; outcome?: string; createdAt: string }[];
};
type PageData = {
  items: User[]; total: number; page: number; pageSize: number; totalPages: number;
  metrics?: Record<string, number>; performers?: User[];
  activities?: { id: string; user?: User; type: string; detail: string; createdAt: string }[];
};
const empty: PageData = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };
const glass = "border border-white/[.09] bg-slate-900/55 shadow-[0_20px_70px_-32px_rgba(0,0,0,.95)] backdrop-blur-xl";
const roles = ["SUPER_ADMIN", "SUPER_HR", "ADMIN", "MANAGER", "EXECUTIVE", "VIEWER"];
const presenceOrder: Presence[] = ["ONLINE", "ON_CALL", "IDLE", "BREAK", "OFFLINE"];

function date(value?: string | null, time = false) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value)) : "Never";
}
function initials(name?: string | null) {
  if (!name) return "";
  return String(name)
    .split(" ")
    .map((part) => (part && part.length ? part[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function title(value?: string | null) { return value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase()) : "ΓÇö"; }
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || body?.message || "Request failed.");
  return body?.data ?? body;
}

export default function UserManagementPage() {
  const [data, setData] = useState<PageData>(empty); const [search, setSearch] = useState("");
  const [role, setRole] = useState(""); const [status, setStatus] = useState(""); const [presence, setPresence] = useState("");
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [drawer, setDrawer] = useState<User | null>(null); const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false); const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) query.set("search", search); if (role) query.set("role", role); if (status) query.set("status", status); if (presence) query.set("presence", presence);
      const result = await api<any>(`/api/users?${query}`);
      if (Array.isArray(result)) {
        const users = result as User[];
        setData({ items: users, total: users.length, page, pageSize, totalPages: Math.max(1, Math.ceil(users.length / pageSize)) });
      } else if ("items" in result) {
        setData(result as PageData);
      } else if (result && result.users) {
        setData({ items: result.users, total: result.total ?? result.users.length, page, pageSize, totalPages: result.totalPages ?? Math.max(1, Math.ceil((result.total ?? result.users.length) / pageSize)) });
      } else {
        setData(empty);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load executives."); }
    finally { setLoading(false); }
  }, [page, pageSize, presence, role, search, status]);
  useEffect(() => { const timer = window.setTimeout(load, 220); return () => clearTimeout(timer); }, [load]);
  const users = data.items ?? [];
  useEffect(() => {
    setSelected((ids) => {
      const filtered = ids.filter((id) => users.some((user) => user.id === id));
      if (filtered.length === ids.length && filtered.every((v, i) => v === ids[i])) return ids;
      return filtered;
    });
  }, [users]);
  const totals = useMemo(() => ({
    total: data.metrics?.total ?? data.total, online: data.metrics?.online ?? users.filter((u) => u.presence === "ONLINE").length,
    offline: data.metrics?.offline ?? users.filter((u) => u.presence === "OFFLINE").length, onCall: data.metrics?.onCall ?? users.filter((u) => u.presence === "ON_CALL").length,
    idle: data.metrics?.idle ?? users.filter((u) => u.presence === "IDLE").length, break: data.metrics?.break ?? users.filter((u) => u.presence === "BREAK").length,
    campaigns: data.metrics?.campaigns ?? new Set(users.map((u) => u.campaign).filter(Boolean)).size,
    calls: data.metrics?.todayCalls ?? users.reduce((sum, u) => sum + (u.todayCalls ?? 0), 0),
    interested: data.metrics?.interested ?? users.reduce((sum, u) => sum + (u.interested ?? 0), 0), booked: data.metrics?.booked ?? users.reduce((sum, u) => sum + (u.booked ?? 0), 0),
  }), [data, users]);
  const cards: [string, number, string, any][] = [
    ["Total Executives", totals.total, "All access levels", Users],
    ["Online", totals.online, "Live now", Activity],
    ["Offline", totals.offline, "Awaiting login", Clock3],
    ["On Call", totals.onCall, "Active conversations", Phone],
    ["Idle", totals.idle, "Ready for work", Zap],
    ["On Break", totals.break, "Temporarily away", CalendarClock],
    ["Active Campaigns", totals.campaigns, "In progress", BriefcaseBusiness],
    ["TodayΓÇÖs Calls", totals.calls, "Across team", Phone],
    ["Interested Leads", totals.interested, "Sales qualified", UserCog],
    ["Booked Leads", totals.booked, "Conversion result", Check],
  ];
  const action = async (id: string, endpoint: string, body?: unknown) => {
    try {
      const payload = endpoint === "status" ? { active: (body as any)?.status === "ACTIVE" } : body;
      await api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload ?? {}) });
      setNotice("Executive updated successfully.");
      await load();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "This operation is not enabled by the current API.");
    }
  };
  const remove = async (id: string) => { if (!window.confirm("Delete this executive permanently?")) return; try { await api(`/api/admin/users/${id}`, { method: "DELETE" }); setDrawer(null); setNotice("Executive deleted."); load(); } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not delete executive."); } };
  const exportUsers = () => { const q = new URLSearchParams(); if (search) q.set("search", search); if (role) q.set("role", role); if (status) q.set("status", status); window.location.assign(`/api/users/export?${q}`); };
  const toggle = (id: string) => setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  return <DashboardLayout><main className="min-h-screen bg-[#070b16] px-4 py-5 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1800px] space-y-5">
    <header className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between"><div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />Live workforce intelligence</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Executive Management</h1><p className="mt-2 text-sm text-slate-400">Manage your sales teams, executives and live performance.</p></div><div className="flex flex-wrap gap-2"><Button label="Add Executive" icon={Plus} primary onClick={() => window.location.assign("/admin/users/new")} /><Button label="Refresh" icon={RefreshCw} onClick={load} /></div></header>
    {notice && <div className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/[.07] px-4 py-3 text-sm text-cyan-100"><span>{notice}</span><button onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-10">{cards.map((c, index) => {
      const label = c[0] as string;
      const value = c[1] as number;
      const hint = c[2] as string;
      const Icon = c[3] as any;
      return (<motion.div key={String(label)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .025 }} className={`${glass} min-w-0 rounded-[20px] p-4`}><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-medium text-slate-400">{String(label)}</p><Icon className="h-3.5 w-3.5 text-cyan-300" /></div><p className="mt-2 text-2xl font-semibold tracking-tight text-white">{Number(value).toLocaleString()}</p><p className="mt-2 truncate text-[10px] text-emerald-300">ΓùÅ {String(hint)}</p></motion.div>);
    })}</section>
    <section className={`${glass} rounded-[24px] p-3 sm:p-4`}><div className="flex flex-col gap-3 xl:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, phone, employee ID, department or team" className="w-full rounded-2xl border border-white/[.1] bg-slate-950/65 py-3 pl-11 pr-10 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10" />{search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}</div><Filter value={role} set={setRole} options={roles} label="All roles" /><Filter value={status} set={setStatus} options={["ACTIVE", "INACTIVE", "SUSPENDED"]} label="All statuses" /><Filter value={presence} set={setPresence} options={presenceOrder} label="All live statuses" /></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Advanced</span>{["Team", "Campaign", "Performance"].map((item) => <span key={item} className="rounded-full bg-white/[.04] px-3 py-1.5 text-xs text-slate-400 ring-1 ring-white/[.08]">{item}</span>)}{(search || role || status || presence) && <button onClick={() => { setSearch(""); setRole(""); setStatus(""); setPresence(""); setPage(1); }} className="ml-auto text-xs font-medium text-cyan-300">Clear filters</button>}</div></section>
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_330px]"><section className={`${glass} overflow-hidden rounded-[24px]`}>{loading ? <Skeleton /> : error ? <Failure error={error} retry={load} /> : users.length === 0 ? <Empty /> : <><div className="flex items-center justify-between border-b border-white/[.07] px-5 py-3"><p className="text-sm font-medium text-slate-300">Executive directory <span className="ml-2 text-xs text-slate-500">{data.total} records</span></p>{selected.length > 0 && <button onClick={() => setBulkOpen(true)} className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">Bulk actions ┬╖ {selected.length}</button>}</div><div className="overflow-x-auto"><table className="w-full min-w-[1600px] text-left"><thead className="bg-white/[.025] text-[10px] font-semibold uppercase tracking-[.11em] text-slate-500"><tr>{["", "Executive", "Employee ID", "Phone", "Email", "Team", "Role", "Campaign", "Leads", "Calls", "Interested", "Booked", "Conversion", "Status", "Shift", "Last Login", ""].map((item, i) => <th key={`${item}-${i}`} className="px-3 py-3.5 first:pl-5">{item && item}</th>)}</tr></thead><tbody>{users.map((user) => <UserRow key={user.id} user={user} checked={selected.includes(user.id)} toggle={() => toggle(user.id)} view={() => setDrawer(user)} edit={() => window.location.assign(`/admin/users/${user.id}/edit`)} reset={() => action(user.id, "reset-password")} disable={() => action(user.id, "status", { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })} remove={() => remove(user.id)} />)}</tbody></table></div><Pager data={data} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} /></>}</section><aside className="space-y-5"><LiveMonitor users={users} /><Leaderboard users={data.performers ?? [...users].sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0)).slice(0, 5)} /><ActivityFeed activities={data.activities ?? []} /></aside></div>
  </div><AnimatePresence>{drawer && <Drawer user={drawer} close={() => setDrawer(null)} action={action} remove={remove} />}{bulkOpen && <BulkModal count={selected.length} close={() => setBulkOpen(false)} action={async (act: string) => {
        setBulkOpen(false);
        // only support deactivate and delete for now
        if (!["deactivate", "delete"].includes(act)) {
          setNotice(`Bulk action not implemented: ${act}`);
          return;
        }
        try {
          await api(`/api/admin/users/bulk`, { method: "POST", body: JSON.stringify({ action: act, userIds: selected }) });
          setNotice("Bulk action completed.");
          await load();
        } catch (e) {
          setNotice(e instanceof Error ? e.message : "Bulk action failed.");
        }
      }} />}</AnimatePresence></main></DashboardLayout>;
}

function Button({ label, icon: Icon, primary, onClick }: { label: string; icon: typeof Plus; primary?: boolean; onClick: () => void }) { return <motion.button whileHover={{ y: -1 }} whileTap={{ scale: .98 }} onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${primary ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "border border-white/[.1] bg-white/[.035] text-slate-300 hover:bg-white/[.08] hover:text-white"}`}><Icon className="h-4 w-4" /><span className="hidden 2xl:inline">{label}</span></motion.button>; }
function Filter({ value, set, options, label }: { value: string; set: (value: string) => void; options: string[]; label: string }) { return <select value={value} onChange={(e) => set(e.target.value)} className="rounded-xl border border-white/[.1] bg-slate-950/65 px-3 py-2.5 text-sm text-slate-300 outline-none"><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{title(option)}</option>)}</select>; }
function Avatar({ user, size = "md" }: { user: any; size?: "sm" | "md" | "lg" }) {
  const style = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs";
  const displayName = user.fullName || (user.username ?? user.name ?? "");
  return <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400/80 to-blue-600/80 font-semibold text-slate-950 ${style}`}>
    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(displayName)}
    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${presenceColor(user.presence)}`} />
  </div>;
}
function presenceColor(value?: Presence) { return value === "ONLINE" ? "bg-emerald-400" : value === "ON_CALL" ? "bg-cyan-300" : value === "IDLE" ? "bg-amber-300" : value === "BREAK" ? "bg-violet-400" : "bg-slate-500"; }
function RoleBadge({ role }: { role: string }) { const color = ["SUPER_ADMIN", "ADMIN"].includes(role) ? "bg-violet-400/10 text-violet-300 ring-violet-400/20" : role === "MANAGER" ? "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20" : "bg-slate-400/10 text-slate-300 ring-slate-400/20"; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${color}`}>{title(role)}</span>; }
function StatusBadge({ user }: { user: User }) { const online = user.presence && user.presence !== "OFFLINE" ? user.presence : user.status; return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[.04] px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/[.1]"><span className={`h-1.5 w-1.5 rounded-full ${presenceColor(user.presence)}`} />{title(online)}</span>; }
function UserRow({ user, checked, toggle, view, edit, reset, disable, remove }: { user: User; checked: boolean; toggle: () => void; view: () => void; edit: () => void; reset: () => void; disable: () => void; remove: () => void }) { return <tr onClick={view} className="group cursor-pointer border-t border-white/[.055] text-sm text-slate-300 transition hover:bg-cyan-400/[.035]"><td className="px-5 py-3"><input type="checkbox" checked={checked} onClick={(e) => e.stopPropagation()} onChange={toggle} className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400" /></td><td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar user={user} /><div><p className="font-medium text-white">{user.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{user.department || "Sales Executive"}</p></div></div></td><Cell>{user.employeeId || "ΓÇö"}</Cell><Cell>{user.phone || "ΓÇö"}</Cell><Cell>{user.email}</Cell><Cell>{user.team || user.department || "ΓÇö"}</Cell><td className="px-3 py-3"><RoleBadge role={user.role} /></td><Cell>{user.campaign || "ΓÇö"}</Cell><NumberCell value={user.assignedLeads} /><NumberCell value={user.completedCalls ?? user.todayCalls} /><NumberCell value={user.interested} /><NumberCell value={user.booked} /><td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${Math.min(100, user.conversion ?? user.performance ?? 0)}%` }} /></div><span className="text-xs">{user.conversion ?? user.performance ?? 0}%</span></div></td><td className="px-3 py-3"><StatusBadge user={user} /></td><Cell>{user.shift || "ΓÇö"}</Cell><Cell nowrap>{date(user.lastLogin, true)}</Cell><td className="px-3 py-3"><div className="flex opacity-70 transition group-hover:opacity-100"><Mini label="Call" icon={Phone} onClick={() => window.location.assign(`tel:${user.phone || ""}`)} /><Mini label="Edit" icon={Edit3} onClick={edit} /><Mini label="More actions" icon={MoreHorizontal} onClick={reset} /><Mini label={user.status === "ACTIVE" ? "Deactivate" : "Activate"} icon={ShieldAlert} onClick={disable} /><Mini label="Delete" icon={Trash2} danger onClick={remove} /></div></td></tr>; }
function Cell({ children, nowrap }: { children: ReactNode; nowrap?: boolean }) { return <td className={`px-3 py-3 text-slate-400 ${nowrap ? "whitespace-nowrap" : ""}`}>{children}</td>; } function NumberCell({ value }: { value?: number }) { return <td className="px-3 py-3 text-center text-slate-300">{value ?? 0}</td>; }
function Mini({ label, icon: Icon, onClick, danger }: { label: string; icon: typeof Edit3; onClick: () => void; danger?: boolean }) { return <button title={label} onClick={(e) => { e.stopPropagation(); onClick(); }} className={`rounded-lg p-1.5 transition hover:scale-105 ${danger ? "text-rose-300 hover:bg-rose-400/10" : "text-slate-400 hover:bg-white/10 hover:text-cyan-200"}`}><Icon className="h-4 w-4" /></button>; }
function Pager({ data, pageSize, setPage, setPageSize }: { data: PageData; pageSize: number; setPage: (value: number) => void; setPageSize: (value: number) => void }) { const pages = Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => Math.max(1, Math.min(data.totalPages - 4, data.page - 2) + i)); return <div className="flex flex-col gap-3 border-t border-white/[.07] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">Showing {data.total ? (data.page - 1) * data.pageSize + 1 : 0}ΓÇô{Math.min(data.page * data.pageSize, data.total)} of {data.total}</p><div className="flex items-center gap-2"><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-300"><option value={10}>10 rows</option><option value={25}>25 rows</option><option value={50}>50 rows</option></select><button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)} className="rounded-lg p-2 text-slate-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>{pages.map((number) => <button key={number} onClick={() => setPage(number)} className={`h-8 min-w-8 rounded-lg text-xs ${number === data.page ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/10"}`}>{number}</button>)}<button disabled={data.page >= data.totalPages} onClick={() => setPage(data.page + 1)} className="rounded-lg p-2 text-slate-400 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>; }
function LiveMonitor({ users }: { users: User[] }) { const active = users.filter((user) => user.presence && user.presence !== "OFFLINE").slice(0, 5); return <section className={`${glass} rounded-[24px] p-5`}><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Live monitoring</p><p className="mt-1 text-xs text-slate-500">Executive availability</p></div><Activity className="h-5 w-5 text-emerald-300" /></div><div className="mt-5 space-y-3">{active.length ? active.map((user) => <div key={user.id} className="flex items-center gap-3"><Avatar user={user} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-200">{user.name}</p><p className="truncate text-[11px] text-slate-500">{user.campaign || "No campaign"}</p></div><StatusBadge user={user} /></div>) : <p className="py-3 text-center text-sm text-slate-500">No executives are live.</p>}</div></section>; }
function Leaderboard({ users }: { users: User[] }) { const labels = ["Top Performer", "Top Conversion", "Fastest Caller", "Most Bookings"]; return <section className={`${glass} rounded-[24px] p-5`}><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Executive leaderboard</p><p className="mt-1 text-xs text-slate-500">Live conversion ranking</p></div><BarChart3 className="h-5 w-5 text-cyan-300" /></div><div className="mt-5 space-y-4">{users.length ? users.slice(0, 4).map((user, index) => <div key={user.id} className="flex items-center gap-3"><span className="w-4 text-xs font-semibold text-slate-500">{index + 1}</span><Avatar user={user} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{user.name}</p><p className="text-[10px] text-slate-500">{labels[index]}</p></div><p className="text-sm font-semibold text-cyan-300">{user.conversion ?? user.performance ?? 0}%</p></div>) : <p className="py-4 text-center text-sm text-slate-500">No performance data available.</p>}</div></section>; }
function ActivityFeed({ activities }: { activities: NonNullable<PageData["activities"]> }) { return <section className={`${glass} rounded-[24px] p-5`}><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">Activity timeline</p><Activity className="h-5 w-5 text-cyan-300" /></div><div className="mt-5 space-y-4">{activities.length ? activities.slice(0, 5).map((item) => <div key={item.id} className="flex gap-3"><div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><div><p className="text-sm text-slate-300">{item.detail}</p><p className="mt-1 text-[11px] text-slate-500">{item.user?.name ? `${item.user.name} ┬╖ ` : ""}{date(item.createdAt, true)}</p></div></div>) : <p className="py-4 text-center text-sm text-slate-500">No recent activity available.</p>}</div></section>; }
function Skeleton() { return <div className="space-y-px p-5">{Array.from({ length: 8 }, (_, row) => <div key={row} className="grid grid-cols-7 gap-4 border-b border-white/[.05] py-5">{Array.from({ length: 7 }, (_, col) => <div key={col} className="h-4 animate-pulse rounded bg-white/[.06]" />)}</div>)}</div>; }
function Empty() { return <div className="grid min-h-[480px] place-items-center p-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"><Users className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-semibold text-white">No Executives Found</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Add an executive or adjust your search to view your sales workforce.</p><button onClick={() => window.location.assign("/admin/users/new")} className="mt-6 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Add Executive</button></div></div>; }
function Failure({ error, retry }: { error: string; retry: () => void }) { return <div className="grid min-h-[420px] place-items-center p-8"><div className="max-w-md rounded-3xl border border-rose-400/15 bg-rose-400/[.045] p-7 text-center"><CircleAlert className="mx-auto h-8 w-8 text-rose-300" /><h2 className="mt-4 font-semibold text-white">Unable to load executives</h2><p className="mt-2 text-sm text-slate-400">{error}</p><button onClick={retry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white"><RefreshCw className="h-4 w-4" />Try again</button></div></div>; }
function Drawer({ user, close, action, remove }: { user: User; close: () => void; action: (id: string, action: string, body?: unknown) => Promise<void>; remove: (id: string) => Promise<void> }) { return <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-white/10 bg-[#0a1020]/95 shadow-2xl backdrop-blur-2xl"><div className="flex justify-between border-b border-white/[.08] p-6"><div className="flex gap-4"><Avatar user={user} size="lg" /><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Executive profile</p><h2 className="mt-1 text-xl font-semibold text-white">{user.name}</h2><p className="mt-1 text-sm text-slate-400">{user.email}</p></div></div><button onClick={close} className="h-fit rounded-xl p-2 text-slate-400 hover:bg-white/10"><X /></button></div><div className="flex flex-wrap gap-2 border-b border-white/[.08] p-4"><Button label="Assign Leads" icon={UserCog} primary onClick={() => action(user.id, "assign-leads")} /><Button label="Transfer Leads" icon={Send} onClick={() => action(user.id, "transfer-leads")} /><Button label="Call" icon={Phone} onClick={() => window.location.assign(`tel:${user.phone || ""}`)} /><Button label="WhatsApp" icon={MessageCircle} onClick={() => window.open(`https://wa.me/${(user.phone || "").replace(/\D/g, "")}`, "_blank")} /><Button label="Email" icon={Mail} onClick={() => window.location.assign(`mailto:${user.email}`)} /><Button label="Edit" icon={Edit3} onClick={() => window.location.assign(`/admin/users/${user.id}/edit`)} /></div><div className="flex-1 space-y-6 overflow-y-auto p-6"><Panel title="Contact & assignment"><Info label="Phone" value={user.phone} /><Info label="Team" value={user.team || user.department} /><Info label="Campaign" value={user.campaign} /><Info label="Shift" value={user.shift} /><Info label="Last login" value={date(user.lastLogin, true)} /></Panel><Panel title="Conversion analytics"><div className="grid grid-cols-3 gap-3 text-center"><Metric label="Assigned" value={user.assignedLeads ?? 0} /><Metric label="Calls" value={user.completedCalls ?? user.todayCalls ?? 0} /><Metric label="Interested" value={user.interested ?? 0} /><Metric label="Booked" value={user.booked ?? 0} /><Metric label="Conversion" value={`${user.conversion ?? user.performance ?? 0}%`} /><Metric label="Avg. duration" value={user.averageCallDuration ?? "ΓÇö"} /></div></Panel><Panel title="Recent activities">{user.activities?.length ? user.activities.map((item) => <div key={item.id} className="border-l border-cyan-400/30 pl-3"><p className="text-sm text-slate-200">{item.detail}</p><p className="mt-1 text-[11px] text-slate-500">{date(item.createdAt, true)}</p></div>) : <p className="text-sm text-slate-500">No activity available.</p>}</Panel><Panel title="Call history">{user.callHistory?.length ? user.callHistory.map((call) => <div key={call.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-300">{call.contact || call.outcome || "Call"}</span><span className="text-slate-500">{call.duration || date(call.createdAt, true)}</span></div>) : <p className="text-sm text-slate-500">No call history available.</p>}</Panel><button onClick={() => remove(user.id)} className="w-full rounded-xl border border-rose-400/20 bg-rose-400/[.07] py-3 text-sm font-medium text-rose-300">Deactivate or delete executive</button></div></motion.aside>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-slate-500">{title}</h3><div className="space-y-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">{children}</div></section>; } function Info({ label, value }: { label: string; value?: ReactNode }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right text-slate-200">{value || "ΓÇö"}</span></div>; } function Metric({ label, value }: { label: string; value: string | number }) { return <div><p className="text-lg font-semibold text-white">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wide text-slate-500">{label}</p></div>; }
function BulkModal({ count, close, action }: { count: number; close: () => void; action: (actionKey: string) => void }) {
  const options: Array<{ label: string; key: string }> = [
    { label: "Assign Leads", key: "assign" },
    { label: "Transfer Team", key: "transfer" },
    { label: "Deactivate", key: "deactivate" },
    { label: "Delete", key: "delete" },
    { label: "Export", key: "export" },
  ];

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><motion.div initial={{ scale: .96, y: 12 }} animate={{ scale: 1, y: 0 }} className={`${glass} w-full max-w-md rounded-[24px] p-6`}><div className="flex justify-between"><div><p className="text-lg font-semibold text-white">Bulk actions</p><p className="mt-1 text-sm text-slate-400">{count} executives selected</p></div><button onClick={close}><X className="text-slate-400" /></button></div><div className="mt-6 grid grid-cols-2 gap-2">{options.map((opt) => <button key={opt.key} onClick={() => action(opt.key)} className="rounded-xl border border-white/[.09] bg-white/[.035] px-3 py-3 text-sm text-slate-200 hover:bg-white/[.08]">{opt.label}</button>)}</div></motion.div></motion.div>;
}
