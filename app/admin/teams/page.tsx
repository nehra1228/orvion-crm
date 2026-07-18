"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UsersRound, Loader2, PlusCircle, Trash2 } from "lucide-react";

type Company = { id: string; name: string; code: string };
type Department = { id: string; name: string; code: string; companyId?: string | null };
type Team = { id: string; name: string; code: string; companyId: string; departmentId?: string | null; company?: Company; department?: Department };

export default function TeamsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", companyId: "", departmentId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [companyRes, departmentRes, teamRes, usersRes] = await Promise.all([
        fetch("/api/admin/companies", { credentials: "include" }),
        fetch("/api/admin/departments", { credentials: "include" }),
        fetch("/api/admin/teams", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
      ]);

      const companiesData = await companyRes.json();
      const departmentsData = await departmentRes.json();
      const teamsData = await teamRes.json();
      const usersData = await usersRes.json();

      if (!companyRes.ok) {
        setCompanies([]);
        setError(companiesData?.error || "Failed to load companies");
      } else {
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        if (!Array.isArray(companiesData)) {
          console.error("Expected companies array but got:", companiesData);
          setError("Unexpected server response while loading companies.");
        }
      }

      if (!departmentRes.ok) {
        setDepartments([]);
        setError((prev) => prev || departmentsData?.error || "Failed to load departments");
      } else {
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        if (!Array.isArray(departmentsData)) {
          console.error("Expected departments array but got:", departmentsData);
          setError((prev) => prev || "Unexpected server response while loading departments.");
        }
      }

      if (!teamRes.ok) {
        setTeams([]);
        setError((prev) => prev || teamsData?.error || "Failed to load teams");
      } else {
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        if (!Array.isArray(teamsData)) {
          console.error("Expected teams array but got:", teamsData);
          setError((prev) => prev || "Unexpected server response while loading teams.");
        }
      }
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("loadData error:", error);
      setCompanies([]);
      setDepartments([]);
      setTeams([]);
      setError("Unable to load team data, please try again.");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/teams", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to create team");
    } else {
      setMessage(`Team created: ${data.name}`);
      setForm({ name: "", code: "", companyId: "", departmentId: "" });
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this team?")) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/teams", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete team");
      } else {
        setMessage("Team deleted");
        await loadData();
      }
    } catch (error) {
      console.error("handleDelete error:", error);
      setError("Unable to delete team, please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Workflow</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Teams</h1>
              <p className="mt-2 text-slate-400">Create teams under companies and departments for lead distribution and monitoring.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><UsersRound className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Create Team</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-slate-400">Team Name</label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Team Code</label>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white uppercase outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Company</label>
                <select value={form.companyId} onChange={(event) => { setForm({ ...form, companyId: event.target.value, departmentId: "" }); const selected = companies.find((company) => company.id === event.target.value); if (!selected) setDepartments([]); }} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                  <option value="">Select company</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Department</label>
                <select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                  <option value="">Select department</option>
                  {departments.filter((department) => department.companyId === form.companyId).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Save Team
              </button>
              {message ? <p className="text-sm text-slate-300">{message}</p> : null}
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Team Distribution</h2>
            {error ? (
              <p className="mt-6 text-sm text-rose-400">{error}</p>
            ) : loading ? (
              <div className="mt-6 flex items-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading teams...</div>
            ) : teams.length === 0 ? (
              <p className="mt-6 text-slate-400">No teams created yet.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {teams.map((team) => {
                  const members = users.filter((u) => u.teamId === team.id);
                  return (
                    <TeamCard key={team.id} team={team} members={members} deleting={deletingId === team.id} onDelete={handleDelete} />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

  function TeamCard({ team, members, deleting, onDelete }: { team: Team; members: any[]; deleting: boolean; onDelete: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">{team.name}</p>
            <p className="mt-1 text-sm text-slate-400">Code: {team.code} · Company: {team.company?.name || team.companyId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((s) => !s)} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Members ({members.length})</button>
            <button type="button" onClick={() => onDelete(team.id)} disabled={deleting} className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">ACTIVE</span>
          </div>
        </div>
        {open && (
          <div className="mt-3 space-y-2">
            {members.length === 0 ? (
              <div className="text-sm text-slate-400">No members in this team.</div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md bg-slate-900 p-2">
                  <div>
                    <div className="font-medium text-white">{m.fullName || m.username}</div>
                    <div className="text-sm text-slate-400">{m.email || "-"} · {m.role}</div>
                  </div>
                  <div className="text-sm text-slate-400">{m.active ? 'Active' : 'Inactive'}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
