"use client"

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

type ExecOption = { id: string; username: string };

export default function UploadLeadsPage() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executives, setExecutives] = useState<ExecOption[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [doNotAutoAssign, setDoNotAutoAssign] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const execs = (data || []).filter((u: any) => u.role === "EXECUTIVE").map((u: any) => ({ id: u.id, username: u.username }));
        setExecutives(execs);
        if (execs.length === 1) setAssignedTo(execs[0].id);
      })
      .catch(() => setExecutives([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setStatus("Please choose a file to upload.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (assignedTo) formData.append("assignedToId", assignedTo);
      if (doNotAutoAssign) formData.append("doNotAutoAssign", "true");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus(result?.message || "Upload failed.");
      } else {
        setStatus(`Imported ${result.created} leads successfully.`);
        setFileName("");
        fileInput.value = "";
      }
    } catch (error) {
      setStatus("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setStatus(null);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Upload Leads</p>
          <h1 className="text-4xl font-bold text-white">Excel / CSV Lead Import</h1>
          <p className="text-slate-400 max-w-2xl">
            Upload a spreadsheet with leads and import them directly into ORVION CRM.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h2 className="text-xl font-semibold text-white">Upload Instructions</h2>
              <div className="mt-4 space-y-3 text-slate-400 text-sm">
                <p>Accepted file formats: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>.</p>
                <p>Required columns: <strong>Name</strong>, <strong>Mobile</strong>.</p>
                <p>Optional columns: <strong>Project</strong>, <strong>City</strong>, <strong>Source</strong>, <strong>Status</strong>, <strong>Remark</strong>, <strong>Notes</strong>, <strong>FollowUpDate</strong>, <strong>AssignedTo</strong>.</p>
                <p>Dates should be in a standard format like YYYY-MM-DD.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="file">
                    Select lead file
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                    <a
                      href="/sample_leads.csv"
                      download
                      className="ml-3 inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      Download sample
                    </a>
                  </div>

                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Assign to Executive (optional)</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                    >
                      <option value="">-- None --</option>
                      {executives.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex items-start gap-3">
                    <input
                      id="doNotAutoAssign"
                      name="doNotAutoAssign"
                      type="checkbox"
                      checked={doNotAutoAssign}
                      onChange={(e) => setDoNotAutoAssign(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="doNotAutoAssign" className="text-sm font-medium text-slate-300">
                        Do not auto-assign leads
                      </label>
                      <p className="text-sm text-slate-500">
                        Leave leads unassigned unless an executive is selected or specified in the file.
                      </p>
                    </div>
                  </div>

                  {fileName && <p className="mt-2 text-sm text-slate-400">Selected file: {fileName}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Uploading…" : "Upload Leads"}
                </button>

                {status && <p className="text-sm text-slate-300">{status}</p>}
              </form>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
