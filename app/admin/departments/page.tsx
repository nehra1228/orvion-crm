"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Layers3, Loader2, PlusCircle, Trash2 } from "lucide-react";

type Company = { id: string; name: string; code: string };
type Department = { id: string; name: string; code: string; companyId: string; company?: Company };

export default function DepartmentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", companyId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [companyRes, departmentRes] = await Promise.all([
        fetch("/api/admin/companies"),
        fetch("/api/admin/departments"),
      ]);

      const companiesData = await companyRes.json();
      const departmentsData = await departmentRes.json();

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
    } catch (error) {
      console.error("loadData error:", error);
      setCompanies([]);
      setDepartments([]);
      setError("Unable to load department data, please try again.");
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

    const response = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to create department");
    } else {
      setMessage(`Department created: ${data.name}`);
      setForm({ name: "", code: "", companyId: "" });
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this department?")) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/departments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete department");
      } else {
        setMessage("Department deleted");
        await loadData();
      }
    } catch (error) {
      console.error("handleDelete error:", error);
      setError("Unable to delete department, please try again.");
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
              <h1 className="mt-2 text-3xl font-bold text-white">Departments</h1>
              <p className="mt-2 text-slate-400">Organize your business by departments such as health, motor, residential or commercial.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><Layers3 className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Create Department</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-slate-400">Department Name</label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Department Code</label>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white uppercase outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Company</label>
                <select value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                  <option value="">Select company</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Save Department
              </button>
              {message ? <p className="text-sm text-slate-300">{message}</p> : null}
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Department Structure</h2>
            {error ? (
              <p className="mt-6 text-sm text-rose-400">{error}</p>
            ) : loading ? (
              <div className="mt-6 flex items-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading departments...</div>
            ) : departments.length === 0 ? (
              <p className="mt-6 text-slate-400">No departments created yet.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {departments.map((department) => (
                  <div key={department.id} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{department.name}</p>
                        <p className="mt-1 text-sm text-slate-400">Code: {department.code} · Company: {department.company?.name || department.companyId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => void handleDelete(department.id)} disabled={deletingId === department.id} className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                          {deletingId === department.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                        </button>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
