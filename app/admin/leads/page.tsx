"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CalendarClock, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, ClipboardCheck, Download, Edit3, ExternalLink,
  Inbox, Loader2, Mail, MoreHorizontal, Phone,
  Plus, RefreshCw, Search, Send, SlidersHorizontal, Trash2, Upload,
  UserCheck, UserPlus, UsersRound, X,
  type LucideProps,
} from "lucide-react";

type UnknownRecord = Record<string, unknown>;
type LeadStatus = "NEW" | "INTERESTED" | "FOLLOW_UP" | "BOOKED" | "LOST" | "OTHER";
type Notice = { tone: "success" | "error" | "info"; message: string } | null;
type ModalName = "create" | "upload" | "assign" | "edit" | "delete" | "deleteAll" | null;
type AssignmentMode = "AUTO" | "UNASSIGNED" | "EXECUTIVE" | "TEAM" | "ROUND_ROBIN";
type DuplicateMode = "SKIP" | "UPDATE" | "IMPORT_ALL";
type LeadFormValue = { name: string; mobile: string; email: string; project: string; city: string; source: string; status?: string; remark?: string; followUpAt?: string };

type StatIcon = React.ComponentType<LucideProps>;

type Lead = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  project: string | null;
  city: string | null;
  source: string | null;
  status: LeadStatus;
  statusLabel: string;
  remark: string | null;
  followUpAt: string | null;
  createdAt: string | null;
  executiveId: string | null;
  executive: string | null;
  teamId: string | null;
  team: string | null;
  raw: UnknownRecord;
};

type PageData = { items: Lead[]; total: number; page: number; pageSize: number; totalPages: number };
type Choice = { id: string; label: string; teamId: string | null };
type Filters = { status: string; executive: string; team: string; city: string; project: string; source: string; remark: string; createdFrom: string; createdTo: string; followUpFrom: string; followUpTo: string };
type UploadSummary = { imported: number | null; skipped: number | null; duplicates: number | null; assigned: number | null; errors: number | null };

const emptyFilters: Filters = { status: "", executive: "", team: "", city: "", project: "", source: "", remark: "", createdFrom: "", createdTo: "", followUpFrom: "", followUpTo: "" };
const emptySummary: UploadSummary = { imported: null, skipped: null, duplicates: null, assigned: null, errors: null };
const glass = "rounded-3xl border border-white/[0.09] bg-slate-950/65 shadow-2xl shadow-black/20 backdrop-blur-xl";
const quietButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:pointer-events-none disabled:opacity-40";

const endpoint = {
  leads: "/api/leads",
  upload: "/api/admin/upload",
  bulkDelete: "/api/leads/bulk-delete",
  bulkAssign: "/api/leads/bulk-assign",
  bulkStatus: "/api/leads/bulk-status",
  executives: "/api/users?role=EXECUTIVE",
  teams: "/api/admin/teams",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function nestedText(value: unknown): string {
  const object = record(value);
  return object ? text(object.name ?? object.fullName ?? object.username ?? object.email) : text(value);
}

function normalizeStatus(value: unknown): { status: LeadStatus; label: string } {
  const label = text(value).replace(/[-_]/g, " ").replace(/\s+/g, " ").trim() || "New";
  const normalized = label.toUpperCase().replace(/\s+/g, "_");
  if (normalized.includes("INTEREST")) return { status: "INTERESTED", label: "Interested" };
  if (normalized.includes("FOLLOW") || normalized.includes("CALLBACK")) return { status: "FOLLOW_UP", label: "Follow Up" };
  if (normalized.includes("BOOK") || normalized.includes("WON") || normalized.includes("CONVERT")) return { status: "BOOKED", label: "Booked" };
  if (normalized.includes("LOST") || normalized.includes("REJECT") || normalized.includes("NOT_INTEREST")) return { status: "LOST", label: "Lost" };
  if (normalized === "NEW" || normalized === "CONTACTED") return { status: "NEW", label: normalized === "CONTACTED" ? "Contacted" : "New" };
  return { status: "OTHER", label };
}

function toLead(value: unknown, index: number): Lead | null {
  const raw = record(value);
  if (!raw) return null;
  const assignedExecutive = raw.assignedExecutive ?? raw.executive ?? raw.assignee ?? raw.owner;
  const assignedTeam = raw.assignedTeam ?? raw.team;
  const status = normalizeStatus(raw.status ?? raw.leadStatus ?? raw.lead_status);
  const id = text(raw.id ?? raw._id ?? raw.leadId) || `lead-${index}`;
  return {
    id,
    name: text(raw.name ?? raw.fullName ?? raw.full_name ?? raw.customerName) || "Unnamed lead",
    mobile: text(raw.mobile ?? raw.phone ?? raw.phoneNumber ?? raw.phone_number),
    email: text(raw.email) || null,
    project: nestedText(raw.project ?? raw.realEstateProject ?? raw.projectName) || null,
    city: text(raw.city ?? raw.location) || null,
    source: text(raw.source ?? raw.leadSource ?? raw.lead_source) || null,
    status: status.status,
    statusLabel: status.label,
    remark: text(raw.remark ?? raw.notes ?? raw.note) || null,
    followUpAt: text(raw.nextFollowUp ?? raw.nextFollowUpAt ?? raw.followUpDate ?? raw.follow_up_at) || null,
    createdAt: text(raw.createdAt ?? raw.created_at ?? raw.date) || null,
    executiveId: text(raw.assignedExecutiveId ?? raw.executiveId ?? record(assignedExecutive)?.id) || null,
    executive: nestedText(assignedExecutive) || null,
    teamId: text(raw.assignedTeamId ?? raw.teamId ?? record(assignedTeam)?.id) || null,
    team: nestedText(assignedTeam) || null,
    raw,
  };
}

function unpackLeads(payload: unknown, page: number, pageSize: number): PageData {
  const object = record(payload);
  const data = record(object?.data);
  const candidate = [object?.items, object?.leads, object?.results, data?.items, data?.leads, object?.data].find(Array.isArray) as unknown[] | undefined;
  const items = (candidate ?? []).map(toLead).filter((lead): lead is Lead => Boolean(lead));
  const totalValue = object?.total ?? data?.total ?? object?.count ?? data?.count;
  const total = typeof totalValue === "number" ? totalValue : Number(totalValue) || items.length;
  const returnedPage = Number(object?.page ?? data?.page) || page;
  const returnedSize = Number(object?.pageSize ?? data?.pageSize) || pageSize;
  const totalPages = Number(object?.totalPages ?? data?.totalPages) || Math.max(1, Math.ceil(total / returnedSize));
  return { items, total, page: returnedPage, pageSize: returnedSize, totalPages };
}

function dateValue(value: string | null): number {
  if (!value) return 0;
  const date = new Date(value).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function dateLabel(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function isWithin(value: string | null, from: string, to: string): boolean {
  if (!from && !to) return true;
  const timestamp = dateValue(value);
  if (!timestamp) return false;
  return (!from || timestamp >= new Date(`${from}T00:00:00`).getTime()) && (!to || timestamp <= new Date(`${to}T23:59:59`).getTime());
}

function apiMessage(payload: unknown, fallback: string): string {
  const object = record(payload);
  const error = record(object?.error);
  return text(error?.message ?? object?.message ?? object?.error) || fallback;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const contentType = response.headers.get("content-type") || "";
  const payload: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
  if (!response.ok) {
    const error = new Error(apiMessage(payload, `Request failed with status ${response.status}.`)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

function endpointUnavailable(error: unknown, url: string): string {
  const status = (error as { status?: number })?.status;
  if (status === 404 || status === 405) return `The optional endpoint ${url} is not available yet. Connect it to enable this action.`;
  return error instanceof Error ? error.message : "The requested action could not be completed.";
}

function csvRows(content: string): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function downloadCsv(leads: Lead[], filename: string): void {
  const headers = ["Lead", "Mobile", "Email", "Project", "City", "Executive", "Team", "Status", "Remark", "Source", "Follow Up", "Created"];
  const escape = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`;
  const rows = leads.map((lead) => [lead.name, lead.mobile, lead.email, lead.project, lead.city, lead.executive, lead.team, lead.statusLabel, lead.remark, lead.source, lead.followUpAt, lead.createdAt].map(escape).join(","));
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(href);
}

export default function LeadsPage() {
  const reducedMotion = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({ ...emptyFilters, executive: searchParams?.get("executiveId") ?? "" }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const updateFilter = (field: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setData((current) => ({ ...current, page: 1 }));
  };
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<Lead | null>(null);
  const [modal, setModal] = useState<ModalName>(null);
  const [targetLead, setTargetLead] = useState<Lead | null>(null);
  const router = useRouter();
  const [executives, setExecutives] = useState<Choice[]>([]);
  const [teams, setTeams] = useState<Choice[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("AUTO");
  const [assignmentExecutive, setAssignmentExecutive] = useState("");
  const [assignmentTeam, setAssignmentTeam] = useState("");
  const [assignmentPriority, setAssignmentPriority] = useState("NORMAL");
  const [assignmentStatus, setAssignmentStatus] = useState("NEW");
  const [working, setWorking] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [newLead, setNewLead] = useState<LeadFormValue>({ name: "", mobile: "", email: "", project: "", city: "", source: "Direct" });
  const [editLead, setEditLead] = useState<LeadFormValue>({ name: "", mobile: "", email: "", project: "", city: "", source: "", status: "NEW", remark: "", followUpAt: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [duplicateRows, setDuplicateRows] = useState(0);
  const [sheetName, setSheetName] = useState("Sheet1");
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("SKIP");
  const [uploadSummary, setUploadSummary] = useState<UploadSummary>(emptySummary);

  const loadLeads = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams({ page: String(data.page), pageSize: String(data.pageSize) });
      if (query.trim()) params.set("search", query.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.executive) params.set("executiveId", filters.executive);
      if (filters.team) params.set("teamId", filters.team);
      if (filters.remark) params.set("remark", filters.remark);
      const response = await requestJson<unknown>(`${endpoint.leads}?${params}`);
      setData(unpackLeads(response, data.page, data.pageSize));
      setSelectedIds([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load leads.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [data.page, data.pageSize, filters, query]);

  useEffect(() => { const timer = window.setTimeout(() => void loadLeads(), 180); return () => window.clearTimeout(timer); }, [loadLeads]);

  useEffect(() => {
    void (async () => {
      const readChoices = async (url: string, labelFields: string[]): Promise<Choice[]> => {
        try {
          const payload = await requestJson<unknown>(url);
          const object = record(payload);
          const values = Array.isArray(payload) ? payload : Array.isArray(object?.data) ? object.data : Array.isArray(object?.items) ? object.items : [];
          return values.map((value) => {
            const item = record(value) ?? {};
            const label = labelFields.map((field) => text(item[field])).find(Boolean) || "Unnamed";
            return { id: text(item.id ?? item._id), label, teamId: text(item.teamId ?? item.assignedTeamId) || null };
          }).filter((choice) => choice.id);
        } catch { return []; }
      };
      const [nextExecutives, nextTeams] = await Promise.all([readChoices(endpoint.executives, ["fullName", "username", "name", "email"]), readChoices(endpoint.teams, ["name", "teamName"])]);
      setExecutives(nextExecutives); setTeams(nextTeams);
    })();
  }, []);

  const visibleLeads = useMemo(() => data.items.filter((lead) => {
    const term = query.trim().toLowerCase();
    const matchesTerm = !term || [lead.name, lead.mobile, lead.project, lead.city, lead.executive, lead.source].some((value) => value?.toLowerCase().includes(term));
    return matchesTerm &&
      (!filters.status || lead.status === filters.status) &&
      (!filters.executive || lead.executiveId === filters.executive) &&
      (!filters.team || lead.teamId === filters.team) &&
      (!filters.city || lead.city?.toLowerCase() === filters.city.toLowerCase()) &&
      (!filters.project || lead.project?.toLowerCase() === filters.project.toLowerCase()) &&
      (!filters.source || lead.source?.toLowerCase() === filters.source.toLowerCase()) &&
      (!filters.remark || (filters.remark === "REMARKED" ? lead.remark !== null : lead.remark === filters.remark)) &&
      isWithin(lead.createdAt, filters.createdFrom, filters.createdTo) &&
      isWithin(lead.followUpAt, filters.followUpFrom, filters.followUpTo);
  }), [data.items, filters, query]);

  const selectedLeads = useMemo(() => visibleLeads.filter((lead) => selectedIds.includes(lead.id)), [selectedIds, visibleLeads]);
  const metrics = useMemo(() => {
    const countStatus = (status: LeadStatus) => visibleLeads.filter((lead) => lead.status === status).length;
    const booked = countStatus("BOOKED");
    return {
      total: data.total || visibleLeads.length,
      unassigned: visibleLeads.filter((lead) => !lead.executiveId && !lead.teamId).length,
      interested: countStatus("INTERESTED"), followUps: countStatus("FOLLOW_UP"), booked, lost: countStatus("LOST"),
      conversion: visibleLeads.length ? Math.round((booked / visibleLeads.length) * 100) : 0,
    };
  }, [data.total, visibleLeads]);

  const uniqueValues = useMemo(() => ({
    cities: [...new Set(data.items.map((lead) => lead.city).filter((value): value is string => Boolean(value)))].sort(),
    projects: [...new Set(data.items.map((lead) => lead.project).filter((value): value is string => Boolean(value)))].sort(),
    sources: [...new Set(data.items.map((lead) => lead.source).filter((value): value is string => Boolean(value)))].sort(),
  }), [data.items]);

  const openAssign = (lead?: Lead) => {
    setTargetLead(lead ?? null);
    setAssignmentExecutive(lead?.executiveId ?? "");
    setAssignmentTeam(lead?.teamId ?? "");
    setAssignmentPriority(text(lead?.raw.priority) || "NORMAL");
    setAssignmentStatus(lead?.status || "NEW");
    setModal("assign");
  };

  const openBulkAssign = () => {
    if (!selectedIds.length) {
      setNotice({ tone: "info", message: "Select one or more leads before assigning them." });
      return;
    }
    openAssign();
  };

  const toggleLead = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const clearModal = () => { setModal(null); setTargetLead(null); setDeletePhrase(""); };

  const executeBulk = async (url: string, body: UnknownRecord, success: string) => {
    setWorking(true);
    try {
      await requestJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setNotice({ tone: "success", message: success }); clearModal(); await loadLeads(true);
    } catch (actionError) {
      setNotice({ tone: "error", message: endpointUnavailable(actionError, url) });
    } finally { setWorking(false); }
  };

  const deleteSelected = async (all = false) => {
    const ids = all ? [] : targetLead ? [targetLead.id] : selectedIds;
    setWorking(true);
    try {
      const response = await requestJson<unknown>(endpoint.bulkDelete, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(all ? { all: true } : { leadIds: ids }) });
      const object = record(response);
      const deleted = Number(object?.deleted ?? object?.count) || (all ? data.total : ids.length);
      setNotice({ tone: "success", message: `${deleted} lead${deleted === 1 ? "" : "s"} deleted.` }); clearModal(); await loadLeads(true);
    } catch (actionError) {
      setNotice({ tone: "error", message: endpointUnavailable(actionError, endpoint.bulkDelete) });
    } finally { setWorking(false); }
  };

  const deleteNotInterested = async () => {
    if (!window.confirm("Delete all 'Not Interested' leads? This cannot be undone.")) return;
    setWorking(true);
    try {
      await requestJson<unknown>(endpoint.bulkDelete, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ remark: "NOT_INTERESTED" }) });
      setNotice({ tone: "success", message: "All not interested leads were deleted." }); await loadLeads(true);
    } catch (actionError) {
      setNotice({ tone: "error", message: endpointUnavailable(actionError, endpoint.bulkDelete) });
    } finally { setWorking(false); }
  };

  const reassignNoAnswer = () => {
    const noAnswerIds = visibleLeads.filter((lead) => lead.remark === "NO_ANSWER").map((lead) => lead.id);
    if (!noAnswerIds.length) {
      setNotice({ tone: "info", message: "No 'No Answer' leads found to reassign." });
      return;
    }
    setSelectedIds(noAnswerIds);
    openAssign();
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setWorking(true);
    try {
      const body = modal === "create" ? { ...newLead, fullName: newLead.name, phone: newLead.mobile } : { ...editLead, fullName: editLead.name, phone: editLead.mobile };
      const url = modal === "create" ? endpoint.leads : `${endpoint.leads}/${targetLead?.id}`;
      await requestJson(url, { method: modal === "create" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setNotice({ tone: "success", message: modal === "create" ? "Lead created successfully." : "Lead updated successfully." }); clearModal(); await loadLeads(true);
    } catch (actionError) {
      setNotice({ tone: "error", message: endpointUnavailable(actionError, modal === "create" ? endpoint.leads : `${endpoint.leads}/:id`) });
    } finally { setWorking(false); }
  };

  const startEdit = (lead: Lead) => {
    setTargetLead(lead);
    setEditLead({ name: lead.name, mobile: lead.mobile, email: lead.email ?? "", project: lead.project ?? "", city: lead.city ?? "", source: lead.source ?? "", status: lead.status, remark: lead.remark ?? "", followUpAt: lead.followUpAt ? lead.followUpAt.slice(0, 10) : "" });
    setModal("edit");
  };

  const previewFile = async (file: File) => {
    setUploadFile(file); setPreviewHeaders([]); setPreviewRows([]); setDuplicateRows(0); setUploadSummary(emptySummary);
    if (!/\.csv$/i.test(file.name)) return;
    const rows = csvRows(await file.text());
    const [headers = [], ...entries] = rows;
    const preview = entries.slice(0, 8);
    const mobileIndex = headers.findIndex((header) => /mobile|phone/i.test(header));
    const emailIndex = headers.findIndex((header) => /email/i.test(header));
    const seen = new Set<string>(); let duplicates = 0;
    entries.forEach((row) => { const key = (mobileIndex >= 0 ? row[mobileIndex] : "") || (emailIndex >= 0 ? row[emailIndex]?.toLowerCase() : ""); if (key && seen.has(key)) duplicates += 1; if (key) seen.add(key); });
    setPreviewHeaders(headers); setPreviewRows(preview); setDuplicateRows(duplicates);
  };

  const importLeads = async () => {
    if (!uploadFile) { setNotice({ tone: "error", message: "Choose a CSV or Excel file before importing." }); return; }
    if (assignmentMode === "EXECUTIVE" && !assignmentExecutive) { setNotice({ tone: "error", message: "Choose an executive for this import." }); return; }
    if (assignmentMode === "TEAM" && !assignmentTeam) { setNotice({ tone: "error", message: "Choose a team for this import." }); return; }
    setWorking(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("assignmentMode", assignmentMode);
      form.append("duplicateHandling", duplicateMode);
      form.append("sheetName", sheetName);
      if (assignmentMode === "EXECUTIVE" && assignmentExecutive) form.append("assignedToId", assignmentExecutive);
      if (assignmentMode === "TEAM" && assignmentTeam) form.append("teamId", assignmentTeam);
      if (assignmentMode === "UNASSIGNED") form.append("doNotAutoAssign", "true");
      const response = await requestJson<unknown>(endpoint.upload, { method: "POST", body: form });
      const object = record(response);
      setUploadSummary({
        imported: Number(object?.imported ?? object?.created ?? object?.count) || null,
        skipped: Number(object?.skipped) || null,
        duplicates: Number(object?.duplicates ?? object?.deduped) || null,
        assigned: Number(object?.assigned) || null,
        errors: Number(object?.errors ?? object?.failed) || null,
      });
      setNotice({ tone: "success", message: "Lead import completed." }); await loadLeads(true);
    } catch (actionError) {
      setNotice({ tone: "error", message: endpointUnavailable(actionError, endpoint.upload) });
    } finally { setWorking(false); }
  };

  const startCall = (lead: Lead) => { if (lead.mobile) window.location.assign(`tel:${lead.mobile.replace(/[^\d+]/g, "")}`); else setNotice({ tone: "info", message: "This lead has no mobile number." }); };
  const startWhatsApp = (lead: Lead) => { if (lead.mobile) window.open(`https://wa.me/${lead.mobile.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer"); else setNotice({ tone: "info", message: "This lead has no mobile number." }); };
  const startEmail = (lead: Lead) => { if (lead.email) window.location.assign(`mailto:${lead.email}`); else setNotice({ tone: "info", message: "This lead has no email address." }); };
  const pageStart = data.total ? ((data.page - 1) * data.pageSize) + 1 : 0;

  return <DashboardLayout><main className="min-h-screen overflow-x-hidden bg-[#07111f] px-4 py-5 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1700px] space-y-5">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">Sales operations</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Lead Management</h1><p className="mt-1 text-sm text-slate-400">Manage every lead from one intelligent workspace.</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => setModal("create")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110"><Plus className="h-4 w-4" />New Lead</button><button onClick={() => router.push("/admin/upload")} className={quietButton}><Upload className="h-4 w-4" />Upload Leads</button><button onClick={openBulkAssign} className={quietButton}><UserPlus className="h-4 w-4" />Assign Leads</button><button onClick={() => downloadCsv(selectedLeads.length ? selectedLeads : visibleLeads, "orvion-leads.csv")} className={quietButton}><Download className="h-4 w-4" />Export</button><button onClick={() => void loadLeads(true)} className={quietButton} aria-label="Refresh leads"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></button><button disabled={!selectedIds.length} onClick={() => { setTargetLead(null); setModal("delete"); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:pointer-events-none disabled:opacity-40"><Trash2 className="h-4 w-4" />Delete Selected</button><button onClick={() => { setTargetLead(null); setModal("deleteAll"); }} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Delete All</button><button onClick={deleteNotInterested} disabled={working} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Delete Not Interested</button><button onClick={reassignNoAnswer} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-500/5 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/10">Reassign No Answer</button></div></header>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">{([
      ["Total Leads", metrics.total, UsersRound, "text-violet-200", "bg-violet-500/15"], ["Unassigned", metrics.unassigned, UserCheck, "text-amber-200", "bg-amber-500/15"], ["Interested", metrics.interested, CircleCheck, "text-emerald-200", "bg-emerald-500/15"], ["Follow Ups", metrics.followUps, CalendarClock, "text-cyan-200", "bg-cyan-500/15"], ["Booked", metrics.booked, ClipboardCheck, "text-sky-200", "bg-sky-500/15"], ["Lost", metrics.lost, CircleAlert, "text-rose-200", "bg-rose-500/15"], ["Conversion", `${metrics.conversion}%`, ArrowRight, "text-indigo-200", "bg-indigo-500/15"],
    ] as Array<[string, string | number, StatIcon, string, string]>).map(([label, value, Icon, color, background], index) => <motion.section key={String(label)} initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.035 }} className={`${glass} min-w-0 p-3.5`}><div className="flex items-start justify-between gap-2"><p className="truncate text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><span className={`rounded-lg p-1.5 ${background}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></span></div><p className="mt-3 text-2xl font-bold tracking-tight text-white">{String(value)}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${typeof value === "number" && metrics.total ? Math.max(5, Math.min(100, (value / metrics.total) * 100)) : Math.max(5, metrics.conversion)}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" /></div></motion.section>)}</section>

    <section className={`${glass} p-3 sm:p-4`}><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" /><input value={query} onChange={(event) => { setQuery(event.target.value); setData((current) => ({ ...current, page: 1 })); }} placeholder="Search by name, mobile, project, city, executive or source" className="w-full rounded-xl border border-white/[0.09] bg-slate-950/70 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/15" /></div><button onClick={() => setFiltersOpen((current) => !current)} className={`${quietButton} ${filtersOpen ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : ""}`}><SlidersHorizontal className="h-4 w-4" />Filters<ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? "rotate-180" : ""}`} /></button><button onClick={() => { setFilters(emptyFilters); setQuery(""); }} className={quietButton}>Clear</button></div>
      <AnimatePresence>{filtersOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-4 grid gap-2 border-t border-white/[0.07] pt-4 sm:grid-cols-2 lg:grid-cols-4"> <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[["", "All statuses"], ["NEW", "New"], ["INTERESTED", "Interested"], ["FOLLOW_UP", "Follow Ups"], ["BOOKED", "Booked"], ["LOST", "Lost"]]} /><FilterSelect label="Executive" value={filters.executive} onChange={(value) => setFilters((current) => ({ ...current, executive: value }))} options={[["", "All executives"], ...executives.map((item) => [item.id, item.label])]} /><FilterSelect label="Team" value={filters.team} onChange={(value) => setFilters((current) => ({ ...current, team: value }))} options={[["", "All teams"], ...teams.map((item) => [item.id, item.label])]} /><FilterSelect label="City" value={filters.city} onChange={(value) => setFilters((current) => ({ ...current, city: value }))} options={[["", "All cities"], ...uniqueValues.cities.map((item) => [item, item])]} /><FilterSelect label="Project" value={filters.project} onChange={(value) => setFilters((current) => ({ ...current, project: value }))} options={[["", "All projects"], ...uniqueValues.projects.map((item) => [item, item])]} /><FilterSelect label="Source" value={filters.source} onChange={(value) => setFilters((current) => ({ ...current, source: value }))} options={[["", "All sources"], ...uniqueValues.sources.map((item) => [item, item])]} /><FilterSelect label="Remark" value={filters.remark} onChange={(value) => setFilters((current) => ({ ...current, remark: value }))} options={[ ["", "All remarks"], ["REMARKED", "Remarked"], ["NOT_INTERESTED", "Not Interested"], ["NO_ANSWER", "No Answer"] ]} /><DateField label="Created from" value={filters.createdFrom} onChange={(value) => setFilters((current) => ({ ...current, createdFrom: value }))} /><DateField label="Created to" value={filters.createdTo} onChange={(value) => setFilters((current) => ({ ...current, createdTo: value }))} /><DateField label="Follow up from" value={filters.followUpFrom} onChange={(value) => setFilters((current) => ({ ...current, followUpFrom: value }))} /><DateField label="Follow up to" value={filters.followUpTo} onChange={(value) => setFilters((current) => ({ ...current, followUpTo: value }))} /></div></motion.div>}</AnimatePresence></section>

    {notice && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.tone === "error" ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : notice.tone === "success" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"}`}><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message"><X className="h-4 w-4" /></button></motion.div>}

    {selectedIds.length > 0 && <motion.section initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} className="sticky top-3 z-20 flex flex-col gap-3 rounded-2xl border border-cyan-300/20 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><span className="rounded-lg bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-100">{selectedIds.length} selected</span><span className="text-xs text-slate-400">Bulk actions apply only to selected leads.</span></div><div className="flex flex-wrap gap-2"><button onClick={openBulkAssign} className={quietButton}><UserPlus className="h-3.5 w-3.5" />Assign</button><button onClick={openBulkAssign} className={quietButton}>Move Team</button><button onClick={openBulkAssign} className={quietButton}>Move Executive</button><button onClick={openBulkAssign} className={quietButton}>Change Status</button><button onClick={() => downloadCsv(selectedLeads, "orvion-selected-leads.csv")} className={quietButton}><Download className="h-3.5 w-3.5" />Export</button><button onClick={() => { setTargetLead(null); setModal("delete"); }} className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/25">Delete</button></div></motion.section>}

    <section className={`${glass} overflow-hidden`}><div className="flex flex-col gap-2 border-b border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-white">Lead workspace</h2><p className="mt-0.5 text-xs text-slate-400">{visibleLeads.length} visible on this page{data.total !== visibleLeads.length ? ` of ${data.total} total` : ""}</p></div><button onClick={() => setSelectedIds(selectedIds.length === visibleLeads.length ? [] : visibleLeads.map((lead) => lead.id))} className={quietButton}>{selectedIds.length === visibleLeads.length && visibleLeads.length ? "Clear page" : "Select page"}</button></div>
      {loading ? <TableSkeleton /> : error ? <StateCard icon={CircleAlert} title="Unable to load leads" detail={error} actionLabel="Retry" onAction={() => void loadLeads()} /> : visibleLeads.length === 0 ? <StateCard icon={Inbox} title="No Leads Found" detail="Create a lead or import a file to start building your pipeline." actionLabel="Upload Leads" onAction={() => router.push("/admin/upload")} secondaryLabel="Create Lead" onSecondary={() => setModal("create")} /> : <><div className="overflow-hidden"><table className="w-full table-fixed"><thead className="bg-white/[0.025] text-left text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500"><tr><th className="w-11 px-3 py-3"><input type="checkbox" checked={selectedIds.length === visibleLeads.length && visibleLeads.length > 0} onChange={(event) => setSelectedIds(event.target.checked ? visibleLeads.map((lead) => lead.id) : [])} aria-label="Select all visible leads" className="h-4 w-4 rounded border-white/15 bg-slate-900 text-cyan-300 focus:ring-cyan-300" /></th><th className="w-[26%] px-2 py-3">Lead</th><th className="w-[16%] px-2 py-3">Mobile</th><th className="hidden w-[13%] px-2 py-3 lg:table-cell">Project</th><th className="hidden w-[10%] px-2 py-3 xl:table-cell">City</th><th className="hidden w-[13%] px-2 py-3 2xl:table-cell">Executive / Team</th><th className="w-[14%] px-2 py-3">Status</th><th className="w-[14%] px-2 py-3 hidden xl:table-cell">Remark</th><th className="hidden w-[12%] px-2 py-3 xl:table-cell">Follow Up</th><th className="w-20 px-2 py-3 text-right">Actions</th></tr></thead><tbody>{visibleLeads.map((lead, index) => <motion.tr key={lead.id} initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.018, 0.2) }} className="border-t border-white/[0.045] text-xs transition hover:bg-white/[0.025]"><td className="px-3 py-3 align-top"><input type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => toggleLead(lead.id)} aria-label={`Select ${lead.name}`} className="h-4 w-4 rounded border-white/15 bg-slate-900 text-cyan-300 focus:ring-cyan-300" /></td><td className="px-2 py-3 align-top"><button onClick={() => setDrawer(lead)} className="block max-w-full text-left"><p className="truncate font-semibold text-white hover:text-cyan-200">{lead.name}</p><p className="mt-1 truncate text-[11px] text-slate-500">{lead.email ?? lead.source ?? "No source"}</p></button></td><td className="truncate px-2 py-3 align-top text-slate-300">{lead.mobile || "-"}</td><td className="hidden truncate px-2 py-3 align-top text-slate-300 lg:table-cell">{lead.project ?? "-"}</td><td className="hidden truncate px-2 py-3 align-top text-slate-400 xl:table-cell">{lead.city ?? "-"}</td><td className="hidden px-2 py-3 align-top 2xl:table-cell"><p className="truncate text-slate-200">{lead.executive ?? "Unassigned"}</p><p className="mt-1 truncate text-[10px] text-slate-500">{lead.team ?? "No team"}</p></td><td className="px-2 py-3 align-top"><StatusBadge status={lead.status} label={lead.statusLabel} /></td><td className="hidden px-2 py-3 align-top text-slate-400 xl:table-cell">{lead.remark || "-"}</td><td className="hidden px-2 py-3 align-top text-slate-400 xl:table-cell">{dateLabel(lead.followUpAt)}</td><td className="px-2 py-2 align-top"><RowActions onView={() => setDrawer(lead)} onEdit={() => startEdit(lead)} onAssign={() => openAssign(lead)} onCall={() => startCall(lead)} onWhatsApp={() => startWhatsApp(lead)} onEmail={() => startEmail(lead)} onDelete={() => { setTargetLead(lead); setModal("delete"); }} /></td></motion.tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 text-xs text-slate-400"><span>Showing {pageStart}-{Math.min(data.page * data.pageSize, data.total)} of {data.total}</span><div className="flex items-center gap-2"><select value={data.pageSize} onChange={(event) => setData((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))} className="rounded-lg border border-white/[0.1] bg-slate-900 px-2 py-1.5 text-xs text-slate-300 outline-none"><option value={10}>10 rows</option><option value={20}>20 rows</option><option value={50}>50 rows</option></select><button disabled={data.page <= 1} onClick={() => setData((current) => ({ ...current, page: current.page - 1 }))} className={quietButton} aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></button><span className="min-w-12 text-center">{data.page} / {data.totalPages}</span><button disabled={data.page >= data.totalPages} onClick={() => setData((current) => ({ ...current, page: current.page + 1 }))} className={quietButton} aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></button></div></div></>}</section>
  </div></main>

  <AnimatePresence>{drawer && <LeadDrawer lead={drawer} onClose={() => setDrawer(null)} onEdit={() => startEdit(drawer)} onAssign={() => openAssign(drawer)} onCall={() => startCall(drawer)} onWhatsApp={() => startWhatsApp(drawer)} onEmail={() => startEmail(drawer)} />}</AnimatePresence>
  <AnimatePresence>{modal && <ModalShell onClose={clearModal}>{modal === "create" || modal === "edit" ? <LeadEditor title={modal === "create" ? "Create new lead" : "Edit lead"} value={modal === "create" ? newLead : editLead} onChange={(field, value) => modal === "create" ? setNewLead((current) => ({ ...current, [field]: value })) : setEditLead((current) => ({ ...current, [field]: value }))} onSubmit={submitLead} busy={working} /> : modal === "upload" ? <UploadDialog file={uploadFile} headers={previewHeaders} rows={previewRows} duplicates={duplicateRows} sheetName={sheetName} onSheetName={setSheetName} duplicateMode={duplicateMode} onDuplicateMode={setDuplicateMode} assignmentMode={assignmentMode} onAssignmentMode={setAssignmentMode} executive={assignmentExecutive} onExecutive={setAssignmentExecutive} team={assignmentTeam} onTeam={setAssignmentTeam} executives={executives} teams={teams} summary={uploadSummary} busy={working} inputRef={fileInput} onFile={previewFile} onImport={() => void importLeads()} /> : modal === "assign" ? <AssignDialog leadCount={targetLead ? 1 : selectedIds.length} executive={assignmentExecutive} onExecutive={setAssignmentExecutive} team={assignmentTeam} onTeam={setAssignmentTeam} priority={assignmentPriority} onPriority={setAssignmentPriority} status={assignmentStatus} onStatus={setAssignmentStatus} executives={executives} teams={teams} busy={working} onSave={() => void executeBulk(endpoint.bulkAssign, { leadIds: targetLead ? [targetLead.id] : selectedIds, executiveId: assignmentExecutive || null, teamId: assignmentTeam || null, priority: assignmentPriority, status: assignmentStatus }, "Lead assignment updated.")} /> : <DeleteDialog all={modal === "deleteAll"} lead={targetLead} selectedCount={selectedIds.length} phrase={deletePhrase} onPhrase={setDeletePhrase} busy={working} onDelete={() => void deleteSelected(modal === "deleteAll")} />}</ModalShell>}</AnimatePresence>
  </DashboardLayout>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="block text-[10px] font-semibold uppercase tracking-[.08em] text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-slate-900 px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/35">{options.map(([id, name]) => <option key={`${id}-${name}`} value={id}>{name}</option>)}</select></label>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[10px] font-semibold uppercase tracking-[.08em] text-slate-500">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-slate-900 px-3 py-2.5 text-xs normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/35" /></label>; }
function StatusBadge({ status, label }: { status: LeadStatus; label: string }) { const style = { NEW: "bg-violet-500/15 text-violet-200", INTERESTED: "bg-emerald-500/15 text-emerald-200", FOLLOW_UP: "bg-amber-500/15 text-amber-200", BOOKED: "bg-cyan-500/15 text-cyan-200", LOST: "bg-rose-500/15 text-rose-200", OTHER: "bg-slate-500/15 text-slate-300" }[status]; return <span className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[10px] font-semibold ${style}`}>{label}</span>; }
function RowActions({ onView, onEdit, onAssign, onCall, onWhatsApp, onEmail, onDelete }: { onView: () => void; onEdit: () => void; onAssign: () => void; onCall: () => void; onWhatsApp: () => void; onEmail: () => void; onDelete: () => void }) { const [open, setOpen] = useState(false); return <div className="relative flex justify-end"><button onClick={() => setOpen((current) => !current)} aria-label="Lead actions" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>{open && <div className="absolute right-0 top-9 z-10 w-36 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl"><ActionItem icon={ExternalLink} label="View" action={() => { setOpen(false); onView(); }} /><ActionItem icon={Edit3} label="Edit" action={() => { setOpen(false); onEdit(); }} /><ActionItem icon={UserPlus} label="Assign" action={() => { setOpen(false); onAssign(); }} /><ActionItem icon={Phone} label="Call" action={() => { setOpen(false); onCall(); }} /><ActionItem icon={Send} label="WhatsApp" action={() => { setOpen(false); onWhatsApp(); }} /><ActionItem icon={Mail} label="Email" action={() => { setOpen(false); onEmail(); }} /><ActionItem icon={Trash2} label="Delete" danger action={() => { setOpen(false); onDelete(); }} /></div>}</div>; }
function ActionItem({ icon: Icon, label, action, danger = false }: { icon: typeof Edit3; label: string; action: () => void; danger?: boolean }) { return <button onClick={action} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition hover:bg-white/[0.07] ${danger ? "text-rose-300" : "text-slate-300"}`}><Icon className="h-3.5 w-3.5" />{label}</button>; }
function TableSkeleton() { return <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>; }
function StateCard({ icon: Icon, title, detail, actionLabel, onAction, secondaryLabel, onSecondary }: { icon: typeof Inbox; title: string; detail: string; actionLabel: string; onAction: () => void; secondaryLabel?: string; onSecondary?: () => void }) { return <div className="px-6 py-16 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10"><Icon className="h-6 w-6 text-cyan-200" /></span><h2 className="mt-4 text-lg font-semibold text-white">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{detail}</p><div className="mt-5 flex justify-center gap-2"><button onClick={onAction} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950">{actionLabel}</button>{secondaryLabel && onSecondary && <button onClick={onSecondary} className={quietButton}>{secondaryLabel}</button>}</div></div>; }
function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#0a1325] p-5 shadow-2xl sm:p-6"><div className="mb-5 flex justify-end"><button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button></div>{children}</motion.div></motion.div>; }
function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="block text-xs font-semibold text-slate-300">{label}{required && <span className="ml-1 text-cyan-300">*</span>}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/10" /></label>; }
function LeadEditor({ title: heading, value, onChange, onSubmit, busy }: { title: string; value: LeadFormValue; onChange: (field: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit}><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-300">Lead workspace</p><h2 className="mt-1 text-xl font-bold text-white">{heading}</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Lead name" value={value.name} onChange={(next) => onChange("name", next)} required /><Field label="Mobile" value={value.mobile} onChange={(next) => onChange("mobile", next)} required /><Field label="Email" value={value.email} onChange={(next) => onChange("email", next)} type="email" /><Field label="Project" value={value.project} onChange={(next) => onChange("project", next)} /><Field label="City" value={value.city} onChange={(next) => onChange("city", next)} /><Field label="Source" value={value.source} onChange={(next) => onChange("source", next)} />{value.status !== undefined && <><FilterSelect label="Status" value={value.status} onChange={(next) => onChange("status", next)} options={[["NEW", "New"], ["INTERESTED", "Interested"], ["FOLLOW_UP", "Follow Up"], ["BOOKED", "Booked"], ["LOST", "Lost"]]} /><Field label="Follow up date" value={value.followUpAt ?? ""} onChange={(next) => onChange("followUpAt", next)} type="date" /></>}</div>{value.remark !== undefined && <label className="mt-4 block text-xs font-semibold text-slate-300">Remark<textarea value={value.remark} onChange={(event) => onChange("remark", event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-white/[0.1] bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/35" /></label>}<button disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{heading}</button></form>; }
function UploadDialog({ file, headers, rows, duplicates, sheetName, onSheetName, duplicateMode, onDuplicateMode, assignmentMode, onAssignmentMode, executive, onExecutive, team, onTeam, executives, teams, summary, busy, inputRef, onFile, onImport }: { file: File | null; headers: string[]; rows: string[][]; duplicates: number; sheetName: string; onSheetName: (value: string) => void; duplicateMode: DuplicateMode; onDuplicateMode: (value: DuplicateMode) => void; assignmentMode: AssignmentMode; onAssignmentMode: (value: AssignmentMode) => void; executive: string; onExecutive: (value: string) => void; team: string; onTeam: (value: string) => void; executives: Choice[]; teams: Choice[]; summary: UploadSummary; busy: boolean; inputRef: RefObject<HTMLInputElement | null>; onFile: (file: File) => void; onImport: () => void }) { const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const next = event.dataTransfer.files?.[0]; if (next) void onFile(next); }; return <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-300">Bulk import</p><h2 className="mt-1 text-xl font-bold text-white">Upload leads</h2><p className="mt-1 text-sm text-slate-400">CSV preview is generated locally. Excel files are passed unchanged to the existing import endpoint.</p><input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0]; if (next) void onFile(next); }} /><div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} className="mt-5 cursor-pointer rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.04] p-7 text-center transition hover:bg-cyan-300/[0.07]"><Upload className="mx-auto h-7 w-7 text-cyan-200" /><p className="mt-3 text-sm font-semibold text-white">{file ? file.name : "Drop CSV or Excel here"}</p><p className="mt-1 text-xs text-slate-400">Click to choose a file. CSV, XLS and XLSX are accepted.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Sheet to import" value={sheetName} onChange={onSheetName} /><FilterSelect label="Duplicate handling" value={duplicateMode} onChange={(value) => onDuplicateMode(value as DuplicateMode)} options={[["SKIP", "Skip duplicates"], ["UPDATE", "Update existing"], ["IMPORT_ALL", "Import all"]]} /></div><div className="mt-5"><p className="text-xs font-semibold text-slate-200">Assignment while importing</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{([ ["AUTO", "Auto Assign", "Use current automatic assignment rules."], ["UNASSIGNED", "Keep Unassigned", "Import without an owner."], ["EXECUTIVE", "Assign to Executive", "Assign the whole file to one executive."], ["TEAM", "Assign to Team", "Assign the whole file to one team."], ["ROUND_ROBIN", "Round Robin", "Distribute equally across active executives."], ] as [AssignmentMode, string, string][]).map(([mode, label, detail]) => <label key={mode} className={`cursor-pointer rounded-xl border p-3 transition ${assignmentMode === mode ? "border-cyan-300/35 bg-cyan-300/[0.08]" : "border-white/[0.08] bg-white/[0.025]"}`}><input type="radio" className="sr-only" checked={assignmentMode === mode} onChange={() => onAssignmentMode(mode)} /><span className="block text-xs font-semibold text-white">{label}</span><span className="mt-1 block text-[11px] text-slate-400">{detail}</span></label>)}</div>{assignmentMode === "EXECUTIVE" && <div className="mt-3"><FilterSelect label="Executive" value={executive} onChange={onExecutive} options={[["", "Choose executive"], ...executives.map((item) => [item.id, item.label])]} /></div>}{assignmentMode === "TEAM" && <div className="mt-3"><FilterSelect label="Team" value={team} onChange={onTeam} options={[["", "Choose team"], ...teams.map((item) => [item.id, item.label])]} /></div>}</div>{headers.length > 0 && <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08]"><div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.03] px-3 py-2"><span className="text-xs font-semibold text-white">Preview: first {rows.length} rows</span><span className="text-xs text-amber-200">{duplicates} duplicate{duplicates === 1 ? "" : "s"} detected in CSV</span></div><div className="overflow-hidden"><table className="w-full table-fixed text-left text-xs"><thead className="text-slate-500"><tr>{headers.slice(0, 5).map((header) => <th key={header} className="truncate px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-white/[0.06] text-slate-300">{row.slice(0, 5).map((cell, cellIndex) => <td key={cellIndex} className="truncate px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div></div>}{Object.values(summary).some((value) => value !== null) && <div className="mt-5 grid grid-cols-5 gap-2">{([ ["Imported", summary.imported], ["Skipped", summary.skipped], ["Duplicates", summary.duplicates], ["Assigned", summary.assigned], ["Errors", summary.errors] ] as [string, number | null][]).map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.04] p-2 text-center"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value ?? "-"}</p></div>)}</div>}<button disabled={!file || busy} onClick={onImport} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Import leads</button></div>; }
function AssignDialog({ leadCount, executive, onExecutive, team, onTeam, priority, onPriority, status, onStatus, executives, teams, busy, onSave }: { leadCount: number; executive: string; onExecutive: (value: string) => void; team: string; onTeam: (value: string) => void; priority: string; onPriority: (value: string) => void; status: string; onStatus: (value: string) => void; executives: Choice[]; teams: Choice[]; busy: boolean; onSave: () => void }) { return <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-300">Assignment</p><h2 className="mt-1 text-xl font-bold text-white">Assign {leadCount} lead{leadCount === 1 ? "" : "s"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><FilterSelect label="Executive" value={executive} onChange={onExecutive} options={[["", "Keep unassigned"], ...executives.map((item) => [item.id, item.label])]} /><FilterSelect label="Team" value={team} onChange={onTeam} options={[["", "No team"], ...teams.map((item) => [item.id, item.label])]} /><FilterSelect label="Priority" value={priority} onChange={onPriority} options={[["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"], ["URGENT", "Urgent"]]} /><FilterSelect label="Status" value={status} onChange={onStatus} options={[["NEW", "New"], ["INTERESTED", "Interested"], ["FOLLOW_UP", "Follow Up"], ["BOOKED", "Booked"], ["LOST", "Lost"]]} /></div><button disabled={busy || leadCount === 0} onClick={onSave} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save assignment</button></div>; }
function DeleteDialog({ all, lead, selectedCount, phrase, onPhrase, busy, onDelete }: { all: boolean; lead: Lead | null; selectedCount: number; phrase: string; onPhrase: (value: string) => void; busy: boolean; onDelete: () => void }) { const count = all ? "all leads" : lead ? lead.name : `${selectedCount} selected leads`; return <div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/12"><Trash2 className="h-5 w-5 text-rose-200" /></span><h2 className="mt-4 text-xl font-bold text-white">Delete {count}?</h2><p className="mt-2 text-sm text-slate-400">This action cannot be undone.{all && " Type DELETE to confirm removal of every lead."}</p>{all && <input value={phrase} onChange={(event) => onPhrase(event.target.value)} placeholder="Type DELETE" className="mt-4 w-full rounded-xl border border-rose-400/25 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-300" />}<button disabled={busy || (all && phrase !== "DELETE")} onClick={onDelete} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Delete permanently</button></div>; }
function LeadDrawer({ lead, onClose, onEdit, onAssign, onCall, onWhatsApp, onEmail }: { lead: Lead; onClose: () => void; onEdit: () => void; onAssign: () => void; onCall: () => void; onWhatsApp: () => void; onEmail: () => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px]"><motion.aside initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/[0.1] bg-[#091224] shadow-2xl"><div className="flex items-start justify-between border-b border-white/[0.08] p-5"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-300">Lead details</p><h2 className="mt-1 truncate text-xl font-bold text-white">{lead.name}</h2><p className="mt-1 text-sm text-slate-400">{lead.mobile || "No mobile"}</p></div><button onClick={onClose} aria-label="Close lead details" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.08]"><X className="h-4 w-4" /></button></div><div className="flex-1 space-y-5 overflow-y-auto p-5"><div className="flex flex-wrap gap-2"><StatusBadge status={lead.status} label={lead.statusLabel} />{lead.source && <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-slate-300">{lead.source}</span>}</div><div className="grid grid-cols-2 gap-3">{[["Project", lead.project], ["City", lead.city], ["Executive", lead.executive], ["Team", lead.team], ["Created", dateLabel(lead.createdAt)], ["Follow Up", dateLabel(lead.followUpAt)]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-[.08em] text-slate-500">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-200">{value || "-"}</p></div>)}</div><section><h3 className="text-sm font-semibold text-white">Timeline</h3><div className="mt-3 space-y-3 border-l border-cyan-300/20 pl-4"><TimelineItem title="Lead created" detail={dateLabel(lead.createdAt)} /><TimelineItem title={`Status: ${lead.statusLabel}`} detail={lead.remark || "Current pipeline status"} />{lead.followUpAt && <TimelineItem title="Follow up scheduled" detail={dateLabel(lead.followUpAt)} />}</div></section><section><h3 className="text-sm font-semibold text-white">Notes</h3><p className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-sm text-slate-400">{lead.remark || "No note has been recorded for this lead."}</p></section><section><h3 className="text-sm font-semibold text-white">Call history</h3><p className="mt-2 rounded-xl border border-dashed border-white/[0.1] p-3 text-xs text-slate-500">Call history will appear here when it is returned by the lead API.</p></section></div><div className="grid grid-cols-3 gap-2 border-t border-white/[0.08] p-4"><button onClick={onCall} className={quietButton}><Phone className="h-4 w-4" />Call</button><button onClick={onWhatsApp} className={quietButton}><Send className="h-4 w-4" />WhatsApp</button><button onClick={onEmail} className={quietButton}><Mail className="h-4 w-4" />Email</button><button onClick={onAssign} className={`${quietButton} col-span-1`}><UserPlus className="h-4 w-4" />Assign</button><button onClick={onEdit} className={`${quietButton} col-span-2`}><Edit3 className="h-4 w-4" />Edit lead</button></div></motion.aside></motion.div>; }
function TimelineItem({ title, detail }: { title: string; detail: string }) { return <div className="relative"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#091224] bg-cyan-300" /><p className="text-xs font-semibold text-slate-200">{title}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div>; }
