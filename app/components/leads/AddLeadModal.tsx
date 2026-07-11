"use client";

import { useState } from "react";

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddLeadModal({
  open,
  onClose,
}: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    budget: "",
    city: "",
    project: "",
    source: "",
    notes: "",
  });

  if (!open) return null;

  async function handleSubmit() {
    if (!form.name || !form.mobile) {
      alert("Name and Mobile are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to create lead");
      }

      alert("Lead Created Successfully!");

      setForm({
        name: "",
        mobile: "",
        email: "",
        budget: "",
        city: "",
        project: "",
        source: "",
        notes: "",
      });

      onClose();

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0C101D] p-8">

        <h2 className="text-2xl font-bold text-white">
          Create New Lead
        </h2>

        <p className="mt-2 text-slate-400">
          Add a new lead to ORVION CRM.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-5">

          <input
            placeholder="Lead Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="Phone Number"
            value={form.mobile}
            onChange={(e) =>
              setForm({ ...form, mobile: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="Budget"
            value={form.budget}
            onChange={(e) =>
              setForm({ ...form, budget: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="Project"
            value={form.project}
            onChange={(e) =>
              setForm({ ...form, project: e.target.value })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            placeholder="Lead Source"
            value={form.source}
            onChange={(e) =>
              setForm({ ...form, source: e.target.value })
            }
            className="col-span-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            className="col-span-2 h-28 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />

        </div>

        <div className="mt-8 flex justify-end gap-4">

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-6 py-3 text-white"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Lead"}
          </button>

        </div>

      </div>

    </div>
  );
}