"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Building2, Loader2, PlusCircle, Trash2 } from "lucide-react";

type Company = {
  id: string;
  name: string;
  code: string;
  businessType: string;
  status: string;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", businessType: "REAL_ESTATE" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCompanies() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/companies");
      const data = await response.json();

      if (!response.ok) {
        setCompanies([]);
        setError(data?.error || "Failed to load companies");
      } else {
        setCompanies(Array.isArray(data) ? data : []);
        if (!Array.isArray(data)) {
          console.error("Expected companies array but got:", data);
          setError("Unexpected server response while loading companies.");
        }
      }
    } catch (error) {
      console.error("loadCompanies error:", error);
      setCompanies([]);
      setError("Unable to load companies, please try again.");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to create company");
    } else {
      setMessage(`Company created: ${data.name}`);
      setForm({ name: "", code: "", businessType: "REAL_ESTATE" });
      await loadCompanies();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this company?")) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/companies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete company");
      } else {
        setMessage("Company deleted");
        await loadCompanies();
      }
    } catch (error) {
      console.error("handleDelete error:", error);
      setError("Unable to delete company, please try again.");
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
              <h1 className="mt-2 text-3xl font-bold text-white">Companies</h1>
              <p className="mt-2 text-slate-400">Create and manage the companies that drive your business units.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><Building2 className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Create Company</h2>
            <p className="mt-2 text-sm text-slate-400">Set up a new real estate or insurance company and assign it to the workflow.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-slate-400">Company Name</label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Company Code</label>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white uppercase outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Business Type</label>
                <select value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Save Company
              </button>
              {message ? <p className="text-sm text-slate-300">{message}</p> : null}
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
            <h2 className="text-xl font-semibold text-white">Existing Companies</h2>
            {error ? (
              <p className="mt-6 text-sm text-rose-400">{error}</p>
            ) : loading ? (
              <div className="mt-6 flex items-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading companies...</div>
            ) : companies.length === 0 ? (
              <p className="mt-6 text-slate-400">No companies yet. Create your first company to begin the workflow.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {companies.map((company) => (
                  <div key={company.id} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{company.name}</p>
                        <p className="mt-1 text-sm text-slate-400">Code: {company.code} · {company.businessType.replace("_", " ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => void handleDelete(company.id)} disabled={deletingId === company.id} className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                          {deletingId === company.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                        </button>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{company.status}</span>
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
