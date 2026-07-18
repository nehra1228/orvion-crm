"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, CalendarCheck2, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, FileText, Gift, Landmark, LogOut, MoreHorizontal, RefreshCw, ShieldCheck, Trash2, UserCheck, UserPlus, Users, X, type LucideIcon } from "lucide-react";

type Employee = { id: string; employeeId?: string; name: string; email?: string; phone?: string; avatarUrl?: string; department?: string; designation?: string; executiveId?: string | null; executiveName?: string | null; status?: string; attendance?: string; joinedAt?: string; salary?: number; ctc?: number; attendancePercent?: number; lateDays?: number; workingHours?: number; assignedLeads?: number; completedCalls?: number; interested?: number; booked?: number; conversion?: number; documents?: { id: string; name: string }[] };
type HRData = { items: Employee[]; total: number; page: number; pageSize: number; totalPages: number; metrics?: Record<string, number> };
type AttendanceItem = { day: string; employeeId: string; name: string; email: string; department: string; role: string; status: string; createdAt: string };
type AttendanceResponse = { counts?: { present: number; absent: number; halfDay: number; leave: number; late: number; total: number }; items?: AttendanceItem[] };
type Section = "Dashboard" | "Employees" | "Attendance" | "Departments" | "Payroll" | "Leave" | "Performance" | "Documents" | "Recruitment";

const empty: HRData = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };
const nav: Section[] = ["Dashboard", "Employees", "Attendance", "Departments", "Payroll", "Leave", "Performance", "Documents", "Recruitment"];
const glass = "border border-white/[.1] bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-cyan-950/20 shadow-[0_24px_80px_-32px_rgba(0,0,0,.95)] backdrop-blur-2xl";
const label = (value?: string | null) => value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, x => x.toUpperCase()) : "—";
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error?.message || "Request failed.");
  return body?.data ?? body;
}

export default function HRMSPage() {
  const router = useRouter();
  const [data, setData] = useState<HRData>(empty), [search, setSearch] = useState(""), [department, setDepartment] = useState("");
  const [status, setStatus] = useState(""), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [drawer, setDrawer] = useState<Employee | null>(null), [selected, setSelected] = useState<string[]>([]), [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState<Section>("Attendance"), [now, setNow] = useState(() => new Date()), [loggingOut, setLoggingOut] = useState(false);
  const [downloadFrom, setDownloadFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloadTo, setDownloadTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0, late: 0, total: 0 });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [isSuperHr, setIsSuperHr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (activeNav === "Attendance") {
        setAttendanceLoading(true); setAttendanceError("");
        const q = new URLSearchParams({ from: downloadFrom, to: downloadTo });
        const result = await api<AttendanceResponse>(`/api/hr/attendance?${q}`);
        const counts = result.counts ?? {
          present: result.items?.filter((x) => x.status === "PRESENT").length ?? 0,
          absent: result.items?.filter((x) => x.status === "ABSENT").length ?? 0,
          halfDay: result.items?.filter((x) => x.status === "HALF_DAY").length ?? 0,
          leave: result.items?.filter((x) => x.status === "ON_LEAVE").length ?? 0,
          late: result.items?.filter((x) => x.status === "LATE").length ?? 0,
          total: result.items?.length ?? 0,
        };
        setAttendanceCounts(counts);
        setAttendanceData(result.items ?? []);
      } else {
        const q = new URLSearchParams({ page: String(page), pageSize: "10" });
        if (search) q.set("search", search); if (department) q.set("department", department); if (status) q.set("status", status);
        const result = await api<HRData | { employees: Employee[]; total: number; totalPages?: number }>(`/api/hr/employees?${q}`);
        setData("items" in result ? result : { items: result.employees, total: result.total, page, pageSize: 10, totalPages: result.totalPages ?? Math.max(1, Math.ceil(result.total / 10)) });
      }
    } catch (reason) {
      if (activeNav === "Attendance") {
        setAttendanceError(reason instanceof Error ? reason.message : "Unable to load attendance records.");
      } else {
        setError(reason instanceof Error ? reason.message : "Unable to load employee records.");
      }
    } finally {
      setLoading(false);
      setAttendanceLoading(false);
    }
  }, [activeNav, department, downloadFrom, downloadTo, page, search, status]);

  const loadUser = useCallback(async () => {
    try {
      const result = await api<{ user: { id: string; role: string } }>("/api/users/me", { method: "GET" });
      setUserRole(result.user?.role ?? "");
      setIsSuperHr(result.user?.role === "SUPER_ADMIN");
    } catch {
      setUserRole("");
      setIsSuperHr(false);
    }
  }, []);

  useEffect(() => { const t = setTimeout(load, 220); return () => clearTimeout(t); }, [load]);
  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = window.setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const employees = data.items ?? [];
  const departments = useMemo(() => Array.from(new Set(employees.map(x => x.department).filter(Boolean))) as string[], [employees]);
  const attendance = useMemo(() => ({ present: employees.filter(x => x.attendance === "PRESENT").length, absent: employees.filter(x => x.attendance === "ABSENT").length, halfDay: employees.filter(x => x.attendance === "HALF_DAY").length, leave: employees.filter(x => x.attendance === "ON_LEAVE").length, late: employees.filter(x => (x.lateDays ?? 0) > 0).length }), [employees]);
  const attendanceStats = useMemo(() => ({ present: attendanceCounts.present, absent: attendanceCounts.absent, halfDay: attendanceCounts.halfDay, leave: attendanceCounts.leave, late: attendanceCounts.late, total: attendanceCounts.total }), [attendanceCounts]);
  const metrics = { total: data.metrics?.total ?? data.total, present: data.metrics?.present ?? attendance.present, absent: data.metrics?.absent ?? attendance.absent, halfDay: data.metrics?.halfDay ?? attendance.halfDay, leave: data.metrics?.leave ?? attendance.leave, late: data.metrics?.late ?? attendance.late, joinings: data.metrics?.newJoinings ?? 0, birthdays: data.metrics?.birthdays ?? 0, pendingSalary: data.metrics?.pendingSalary ?? 0 };
  const allSelected = employees.length > 0 && employees.every(x => selected.includes(x.id));
  const toggle = (id: string) => setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const toggleAll = () => setSelected(allSelected ? [] : employees.map(x => x.id));
  const deactivateEmployee = async (id: string) => {
    try {
      await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      });
      setNotice("Employee deactivated.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to deactivate employee.");
    }
  };
  const removeEmployee = async (id: string) => {
    if (!window.confirm("Delete this executive permanently?")) return;
    try {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
      setNotice("Executive deleted.");
      setSelected((ids) => ids.filter((item) => item !== id));
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to delete executive.");
    }
  };
  const action = async (id: string, path: string, body?: unknown) => {
    try {
      await api(`/api/hr/employees/${id}/${path}`, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      setNotice("Employee record updated.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "This action is not enabled by your HR API.");
    }
  };
  const markAttendance = async (id?: string) => {
    try {
      const body: Record<string, string> = { status: "PRESENT" };
      if (id) body.userId = id;
      await api(`/api/hr/attendance/mark`, { method: "POST", body: JSON.stringify(body) });
      setNotice(id ? "Attendance marked for employee." : "Attendance marked.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to mark attendance.");
    }
  };
  const logout = async () => { setLoggingOut(true); try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } finally { localStorage.removeItem("orvion-login-username"); router.push("/login"); } };
  const downloadAttendance = async () => {
    if (!downloadFrom || !downloadTo) {
      setNotice("Please choose both from and to dates.");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`/api/hr/attendance?from=${downloadFrom}&to=${downloadTo}&format=csv`);
      if (!res.ok) throw new Error("Failed to download attendance");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${downloadFrom}-${downloadTo}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice(`Downloaded attendance ${downloadFrom} → ${downloadTo}`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to download attendance");
    } finally {
      setDownloading(false);
    }
  };
  const kpis: [string, number, LucideIcon][] = [["Total Employees", metrics.total, Users], ["Present Today", metrics.present, UserCheck], ["Absent", metrics.absent, CircleAlert], ["Half Day", metrics.halfDay, Clock3], ["On Leave", metrics.leave, CalendarCheck2], ["Late Entry", metrics.late, Clock3], ["New Joinings", metrics.joinings, UserPlus], ["Birthdays", metrics.birthdays, Gift], ["Pending Salary", metrics.pendingSalary, Landmark]];

  const cards = (items: [string, number][]) => <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">{items.map(([name, value]) => <div key={name} className="rounded-2xl border border-white/[.08] bg-slate-950/50 p-4 sm:p-5"><p className="text-sm text-slate-400">{name}</p><p className="mt-2 text-3xl font-semibold text-white">{value.toLocaleString()}</p></div>)}</div>;
  const intro = (eyebrow: string, title: string, description: string) => <div className={`${glass} rounded-[20px] p-4 sm:rounded-[24px] sm:p-6`}><p className="text-xs uppercase tracking-[.18em] text-cyan-300">{eyebrow}</p><h2 className="mt-3 break-words text-2xl font-semibold text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-400">{description}</p></div>;
  const section = () => {
    if (activeNav === "Employees") return <div className="space-y-5">{intro("Employee roster", "All employees", "Search, filter and manage the HR employee table.")} {cards([["Total employees", metrics.total], ["Active employees", employees.filter(x => x.status !== "INACTIVE").length], ["Departments", departments.length]])} <EmployeeTable /></div>;
    if (activeNav === "Attendance") return <div className="space-y-5"><div className={`${glass} rounded-[20px] p-4 sm:rounded-[24px] sm:p-6`}><div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="min-w-0"><p className="text-xs uppercase tracking-[.18em] text-cyan-300">Attendance sheet</p><h2 className="mt-3 break-words text-2xl font-semibold text-white sm:text-3xl">Realtime attendance</h2><p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-400">Updated automatically every 30 seconds. Review attendance states and employee records.</p></div><div className="flex shrink-0 flex-wrap items-center gap-3"><div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[.08] bg-slate-950/50 p-3"><label className="text-slate-300 text-xs">From<input type="date" value={downloadFrom} onChange={(e) => setDownloadFrom(e.target.value)} className="ml-2 rounded-lg border border-white/[.1] bg-slate-900/80 px-2 py-1 text-sm text-slate-100" /></label><label className="text-slate-300 text-xs">To<input type="date" value={downloadTo} onChange={(e) => setDownloadTo(e.target.value)} className="ml-2 rounded-lg border border-white/[.1] bg-slate-900/80 px-2 py-1 text-sm text-slate-100" /></label></div><Button label={downloading ? "Downloading..." : "Download"} icon={FileText} click={downloadAttendance} /><Button label="Mark attendance" icon={CalendarCheck2} click={() => markAttendance()} /><Button label="Refresh" icon={RefreshCw} click={load} /><Button label="Employees" icon={Users} click={() => setActiveNav("Employees")} /></div></div><div className="mt-5">{cards([["Present", attendanceStats.present], ["Absent", attendanceStats.absent], ["Half day", attendanceStats.halfDay], ["On leave", attendanceStats.leave]])}</div></div>{attendanceLoading ? <Loading /> : attendanceError ? <Failure error={attendanceError} retry={load} /> : (isSuperHr ? <AttendanceRecordTable items={attendanceData} /> : <div className={`${glass} rounded-[20px] p-6`}><p className="text-sm text-slate-300">Attendance details are visible to Super HR only. The counts below reflect the current attendance state for the selected period.</p><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{["Present", "Absent", "Half day", "On leave", "Late"].map((label, index) => <div key={label} className="rounded-2xl border border-white/[.08] bg-slate-950/70 p-4 text-center"><p className="text-xs uppercase tracking-[.16em] text-slate-400">{label}</p><p className="mt-3 text-3xl font-semibold text-white">{label === "Present" ? attendanceStats.present : label === "Absent" ? attendanceStats.absent : label === "Half day" ? attendanceStats.halfDay : label === "On leave" ? attendanceStats.leave : attendanceStats.late}</p></div>)} </div></div>)} </div>;
    if (activeNav === "Dashboard") return <div className="space-y-5">{intro("Dashboard overview", "HR Operations Dashboard", "A live summary of HR attendance, hiring and people health.")} {cards([["Present", attendanceStats.present], ["Absent", attendanceStats.absent], ["Half day", attendanceStats.halfDay], ["On leave", attendanceStats.leave]])}</div>;
    if (activeNav === "Departments") return <div className="space-y-5">{intro("Departments", "Team structures", "Review department coverage, active headcount and team health.")}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{departments.map(dept => <div key={dept} className="rounded-3xl border border-white/[.08] bg-slate-950/50 p-5"><p className="text-sm uppercase tracking-[.18em] text-slate-400">{dept}</p><p className="mt-3 text-3xl font-semibold text-white">{employees.filter(x => x.department === dept).length}</p></div>)}</div></div>;
    const map: Record<Exclude<Section, "Dashboard" | "Employees" | "Attendance" | "Departments">, [string, string, string]> = { Payroll: ["Payroll", "Payroll overview", "Summary of salary costs and pending payroll actions."], Leave: ["Leave management", "Leave overview", "Track leave counts and absence trends across your teams."], Performance: ["Performance", "Team performance", "Review calls, conversions and attendance-driven output."], Documents: ["Documents", "Documents hub", "Upload and manage HR documents for employees and teams."], Recruitment: ["Recruitment", "Hiring pipeline", "Track open roles, candidate progress, and HR hiring workflows."] };
    const [a, b, c] = map[activeNav as keyof typeof map]; return intro(a, b, c);
  };

  function EmployeeTable({ attendanceOnly = false }: { attendanceOnly?: boolean }) { return <div className={`${glass} min-w-0 overflow-hidden rounded-[20px] sm:rounded-[24px]`}>{loading ? <Loading /> : error ? <Failure error={error} retry={load} /> : !employees.length ? <Empty /> : <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3 sm:px-5"><p className="text-sm font-medium text-slate-200">{attendanceOnly ? "Attendance details" : "Employee database"}<span className="ml-2 text-xs text-slate-500">{data.total} records</span></p>{!attendanceOnly && <button onClick={toggleAll} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">{allSelected ? "Clear selection" : "Select page"}</button>}</div><div className="w-full max-w-full overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[740px] text-left text-sm sm:min-w-[900px] xl:min-w-[1150px]"><thead className="bg-white/[.025] text-[10px] uppercase tracking-[.11em] text-slate-500"><tr>{["", "Employee", ...(attendanceOnly ? ["Department", "Attendance", "Late days", "Joined", "Status"] : ["ID", "Department", "Executive account", "Attendance", "Performance", "Salary", "Status", "Joined", ""])].map((x, i) => <th key={`${x}-${i}`} className="px-3 py-3.5 first:pl-5">{x}</th>)}</tr></thead><tbody>{employees.map(e => attendanceOnly ? <AttendanceRow key={e.id} employee={e} selected={selected.includes(e.id)} toggle={() => toggle(e.id)} view={() => setDrawer(e)} /> : <EmployeeRow key={e.id} employee={e} selected={selected.includes(e.id)} toggle={() => toggle(e.id)} view={() => setDrawer(e)} edit={() => action(e.id, "edit")} deactivate={() => deactivateEmployee(e.id)} remove={() => removeEmployee(e.id)} />)}</tbody></table></div><Pager data={data} page={page} set={setPage} /></>}</div> }
function AttendanceRecordTable({ items }: { items: AttendanceItem[] }) { return <div className={`${glass} min-w-0 overflow-hidden rounded-[20px] sm:rounded-[24px]`}><div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3 sm:px-5"><p className="text-sm font-medium text-slate-200">Attendance details<span className="ml-2 text-xs text-slate-500">{items.length} records</span></p></div><div className="w-full max-w-full overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[900px] text-left text-sm sm:min-w-[1100px]"><thead className="bg-white/[.05] text-[10px] uppercase tracking-[.11em] text-slate-500"><tr><th className="px-3 py-3.5 first:pl-5">Employee</th><th className="px-3 py-3.5">Department</th><th className="px-3 py-3.5">Status</th><th className="px-3 py-3.5">Date</th><th className="px-3 py-3.5">Time</th><th className="px-3 py-3.5">Role</th><th className="px-3 py-3.5">Email</th></tr></thead><tbody>{items.map((item) => <tr key={`${item.employeeId}-${item.day}`} className="border-t border-white/[.06] text-slate-300 hover:bg-cyan-400/[.03]"><td className="px-3 py-3"><div className="font-medium text-white">{item.name}</div><div className="text-[11px] text-slate-500">{item.employeeId}</div></td><td className="px-3 py-3">{item.department}</td><td className="px-3 py-3"><Badge value={item.status} /></td><td className="px-3 py-3">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.day))}</td><td className="px-3 py-3">{new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}</td><td className="px-3 py-3">{item.role}</td><td className="px-3 py-3">{item.email || "—"}</td></tr>)}</tbody></table></div></div>; }

  return <main className="relative min-h-screen overflow-x-hidden bg-[#050816] px-3 py-3 text-slate-100 sm:px-5 sm:py-5 lg:px-8"><div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-40 -top-32 h-[480px] w-[480px] rounded-full bg-cyan-500/[.12] blur-[130px]" /><div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/[.12] blur-[150px]" /></div><div className="relative mx-auto max-w-[1800px] space-y-4 sm:space-y-5"><header className={`${glass} flex min-w-0 flex-col gap-4 rounded-[20px] p-4 sm:rounded-[28px] sm:p-5 2xl:flex-row 2xl:items-end 2xl:justify-between`}><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-cyan-300"><span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300" />ORVION · People operations</p><h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-white sm:text-4xl">Good morning, HR team</h1><p className="mt-2 break-words text-sm leading-6 text-slate-400">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(now)} · Workforce intelligence in one place.</p></div><div className="flex flex-wrap gap-2"><Button label="Add Executive" icon={UserPlus} primary click={() => setNotice("Executive creation can be opened here.")} /><Button label="Mark Attendance" icon={CalendarCheck2} click={() => setActiveNav("Attendance")} /><Button label={loggingOut ? "Logging out" : "Logout"} icon={LogOut} click={logout} /><Button label="Refresh" icon={RefreshCw} click={load} /></div></header>{notice && <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/[.07] px-4 py-3 text-sm text-cyan-100"><span>{notice}</span><button onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}<section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">{kpis.map(([name, value, Icon]) => <button key={name} onClick={() => setActiveNav(name === "Pending Salary" ? "Payroll" : name === "On Leave" ? "Leave" : name === "Total Employees" ? "Employees" : "Attendance")} className={`${glass} min-w-0 rounded-[20px] p-4 text-left`}><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] text-slate-400">{name}</p><Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" /></div><p className="mt-2 text-2xl font-semibold text-white">{value.toLocaleString()}</p></button>)}</section><div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5"><aside className={`${glass} min-w-0 rounded-[20px] p-2 sm:p-3 lg:sticky lg:top-5 lg:h-fit lg:rounded-[24px]`}><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">HR workspace</p><div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">{nav.map((item, i) => <button key={item} onClick={() => setActiveNav(item)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition lg:w-full lg:gap-3 ${activeNav === item ? "bg-gradient-to-r from-cyan-400/20 to-blue-500/10 text-cyan-100 ring-1 ring-cyan-400/25" : "text-slate-400 hover:bg-white/[.05] hover:text-slate-200"}`}><span className={`h-1.5 w-1.5 rounded-full ${activeNav === item ? "bg-cyan-300" : "bg-current opacity-50"}`} />{item}<span className="ml-auto hidden text-[10px] text-slate-600 lg:inline">0{i + 1}</span></button>)}</div></aside><div className="min-w-0 space-y-5">{section()}</div></div></div><AnimatePresence>{drawer && <Drawer employee={drawer} close={() => setDrawer(null)} action={action} />}</AnimatePresence></main>;
}

function Button({ label, icon: Icon, primary, click }: { label: string; icon: LucideIcon; primary?: boolean; click: () => void }) { return <button onClick={click} title={label} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${primary ? "bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 text-slate-950" : "border border-white/[.1] bg-white/[.035] text-slate-300"}`}><Icon className="h-4 w-4 shrink-0" /><span className="hidden sm:inline">{label}</span></button>; }
function Avatar({ employee, large }: { employee: Employee; large?: boolean }) { return <div className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-semibold text-slate-950 ${large ? "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl" : "h-9 w-9 text-xs"}`}>{employee.avatarUrl ? <img src={employee.avatarUrl} alt="" className="h-full w-full object-cover" /> : employee.name.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase()}</div>; }
function Badge({ value }: { value?: string }) { return <span className="inline-flex whitespace-nowrap rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-200 ring-1 ring-cyan-400/20">{label(value)}</span>; }
function EmployeeRow({ employee, selected, toggle, view, edit, deactivate, remove }: { employee: Employee; selected: boolean; toggle: () => void; view: () => void; edit: () => void; deactivate: () => void; remove: () => void }) { return <tr onClick={view} className="cursor-pointer border-t border-white/[.055] text-slate-300 hover:bg-cyan-400/[.035]"><td className="px-5 py-3"><input type="checkbox" checked={selected} onClick={e => e.stopPropagation()} onChange={toggle} className="h-4 w-4" /></td><td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar employee={employee} /><div className="min-w-0"><p className="truncate font-medium text-white">{employee.name}</p><p className="truncate text-[11px] text-slate-500">{employee.designation || "Employee"}</p></div></div></td><Cell>{employee.employeeId || "—"}</Cell><Cell>{employee.department || "—"}</Cell><Cell>{employee.executiveName || (employee.executiveId ? "Linked executive" : "Not linked")}</Cell><td className="px-3 py-3"><Badge value={employee.attendance || "PRESENT"} /></td><Cell>{employee.conversion ?? 0}% conversion</Cell><Cell>₹{(employee.salary ?? 0).toLocaleString()}</Cell><td className="px-3 py-3"><Badge value={employee.status || "ACTIVE"} /></td><Cell>{date(employee.joinedAt)}</Cell><td className="px-3 py-3"><div className="flex"><Action icon={MoreHorizontal} click={edit} /><Action icon={ShieldCheck} click={deactivate} /><Action icon={Trash2} click={remove} danger /></div></td></tr>; }
function AttendanceRow({ employee, selected, toggle, view }: { employee: Employee; selected: boolean; toggle: () => void; view: () => void }) { return <tr onClick={view} className="cursor-pointer border-t border-white/[.055] text-slate-300 hover:bg-cyan-400/[.035]"><td className="px-5 py-3"><input type="checkbox" checked={selected} onClick={e => e.stopPropagation()} onChange={toggle} className="h-4 w-4" /></td><td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar employee={employee} /><div className="min-w-0"><p className="truncate font-medium text-white">{employee.name}</p><p className="truncate text-[11px] text-slate-500">{employee.email || employee.phone || "No contact"}</p></div></div></td><Cell>{employee.department || "—"}</Cell><td className="px-3 py-3"><Badge value={employee.attendance || "Not marked"} /></td><Cell>{employee.lateDays ?? 0}</Cell><Cell>{date(employee.joinedAt)}</Cell><td className="px-3 py-3"><Badge value={employee.status || "ACTIVE"} /></td></tr>; }
function Cell({ children }: { children: ReactNode }) { return <td className="whitespace-nowrap px-3 py-3 text-slate-400">{children}</td>; }
function Action({ icon: Icon, click, danger }: { icon: LucideIcon; click: () => void; danger?: boolean }) { return <button onClick={e => { e.stopPropagation(); click(); }} className={`rounded-lg p-1.5 ${danger ? "text-rose-300" : "text-slate-400"}`}><Icon className="h-4 w-4" /></button>; }
function Pager({ data, page, set }: { data: HRData; page: number; set: (value: number) => void }) { return <div className="flex items-center justify-between gap-3 border-t border-white/[.07] px-4 py-3 sm:px-5 sm:py-4"><p className="text-xs text-slate-500">{data.total ? `${(page - 1) * data.pageSize + 1}–${Math.min(page * data.pageSize, data.total)} of ${data.total}` : "No records"}</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => set(page - 1)} className="rounded-lg p-2 text-slate-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= data.totalPages} onClick={() => set(page + 1)} className="rounded-lg p-2 text-slate-400 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>; }
function Drawer({ employee, close, action }: { employee: Employee; close: () => void; action: (id: string, path: string, body?: unknown) => Promise<void> }) { return <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-white/10 bg-[#0a1020]/95 shadow-2xl backdrop-blur-2xl"><div className="flex min-w-0 justify-between gap-3 border-b border-white/[.08] p-4 sm:p-6"><div className="flex min-w-0 gap-3 sm:gap-4"><Avatar employee={employee} large /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Employee profile</p><h2 className="mt-1 truncate text-xl font-semibold text-white">{employee.name}</h2><p className="mt-1 truncate text-sm text-slate-400">{employee.designation || employee.department || "Employee"}</p></div></div><button onClick={close}><X className="h-5 w-5 text-slate-400" /></button></div><div className="flex flex-wrap gap-2 border-b border-white/[.08] p-3 sm:p-4"><Button label="Edit" icon={MoreHorizontal} click={() => action(employee.id, "edit")} primary /><Button label="Attendance" icon={CalendarCheck2} click={() => action(employee.id, "attendance")} /></div><div className="flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-6"><Panel title="CRM executive link"><Info title="Executive account" value={employee.executiveName || "Not linked"} /><Info title="Assigned leads" value={employee.assignedLeads ?? 0} /><Info title="Completed calls" value={employee.completedCalls ?? 0} /></Panel><Panel title="Attendance & performance"><div className="grid grid-cols-3 gap-2 text-center sm:gap-3"><Stat name="Attendance" value={`${employee.attendancePercent ?? 0}%`} /><Stat name="Late days" value={employee.lateDays ?? 0} /><Stat name="Working hrs" value={employee.workingHours ?? 0} /></div></Panel><Panel title="Salary"><Info title="Monthly salary" value={`₹${(employee.salary ?? 0).toLocaleString()}`} /><Info title="CTC" value={`₹${(employee.ctc ?? 0).toLocaleString()}`} /></Panel><button onClick={() => action(employee.id, "status", { status: "INACTIVE" })} className="w-full rounded-xl border border-rose-400/20 bg-rose-400/[.07] py-3 text-sm text-rose-300">Deactivate employee</button></div></motion.aside>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-slate-500">{title}</h3><div className="space-y-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 sm:p-4">{children}</div></section>; }
function Info({ title, value }: { title: string; value: ReactNode }) { return <div className="flex items-start justify-between gap-3 text-sm"><span className="text-slate-500">{title}</span><span className="break-all text-right text-slate-200">{value}</span></div>; }
function Stat({ name, value }: { name: string; value: string | number }) { return <div><p className="text-lg font-semibold text-white">{value}</p><p className="text-[9px] uppercase text-slate-500">{name}</p></div>; }
function Loading() { return <div className="space-y-4 p-6">{Array.from({ length: 7 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[.05]" />)}</div>; }
function Empty() { return <div className="grid min-h-[300px] place-items-center p-8 text-center"><div><Users className="mx-auto h-10 w-10 text-cyan-300" /><h2 className="mt-4 text-xl font-semibold text-white">No Employees</h2><p className="mt-2 text-sm text-slate-400">Add your first employee to create your HR workspace.</p></div></div>; }
function Failure({ error, retry }: { error: string; retry: () => void }) { return <div className="grid min-h-[300px] place-items-center p-8 text-center"><div><CircleAlert className="mx-auto h-9 w-9 text-rose-300" /><h2 className="mt-4 text-lg font-semibold text-white">Unable to load HRMS</h2><p className="mt-2 text-sm text-slate-400">{error}</p><button onClick={retry} className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm">Retry</button></div></div>; }

