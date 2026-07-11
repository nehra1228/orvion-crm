"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditLeadFormProps {
  lead: any;
}

export default function EditLeadForm({
  lead,
}: EditLeadFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: lead.name,
    mobile: lead.mobile,
    project: lead.project || "",
    city: lead.city || "",
    source: lead.source || "",
    notes: lead.notes || "",
    status: lead.status,
  });

  async function saveLead() {
    setLoading(true);

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead");
      }

      alert("Lead Updated Successfully!");

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-8">

      <h1 className="mb-8 text-3xl font-bold text-white">
        Edit Lead
      </h1>

      <div className="grid grid-cols-2 gap-5">

        <input
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          placeholder="Name"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

        <input
          value={form.mobile}
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value })
          }
          placeholder="Mobile"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

        <input
          value={form.project}
          onChange={(e) =>
            setForm({ ...form, project: e.target.value })
          }
          placeholder="Project"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

        <input
          value={form.city}
          onChange={(e) =>
            setForm({ ...form, city: e.target.value })
          }
          placeholder="City"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

        <input
          value={form.source}
          onChange={(e) =>
            setForm({ ...form, source: e.target.value })
          }
          placeholder="Source"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        >
          <option value="NEW">NEW</option>
          <option value="CALLED">CALLED</option>
          <option value="INTERESTED">INTERESTED</option>
          <option value="FOLLOW_UP">FOLLOW UP</option>
          <option value="SITE_VISIT">SITE VISIT</option>
          <option value="NEGOTIATION">NEGOTIATION</option>
          <option value="BOOKED">BOOKED</option>
          <option value="LOST">LOST</option>
        </select>

        <textarea
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
          placeholder="Notes"
          className="col-span-2 h-36 rounded-xl bg-slate-900 px-4 py-3 text-white"
        />

      </div>

      <button
        onClick={saveLead}
        disabled={loading}
        className="mt-8 rounded-xl bg-cyan-500 px-8 py-3 font-bold text-black"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>

    </div>
  );
}