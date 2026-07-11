"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  Pencil,
  Eye,
  Trash2,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  mobile: string;
  budget?: number | null;
  source?: string | null;
  status: string;
  assignedTo?: {
    username: string;
  } | null;
}

const statusColor: Record<string, string> = {
  NEW: "bg-cyan-500/20 text-cyan-400",
  CALLED: "bg-blue-500/20 text-blue-400",
  INTERESTED: "bg-green-500/20 text-green-400",
  FOLLOW_UP: "bg-yellow-500/20 text-yellow-400",
  SITE_VISIT: "bg-purple-500/20 text-purple-400",
  NEGOTIATION: "bg-orange-500/20 text-orange-400",
  BOOKED: "bg-emerald-500/20 text-emerald-400",
  LOST: "bg-red-500/20 text-red-400",
};

export default function LeadTable() {

  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchLeads();

async function deleteLead(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this lead?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete lead");
    }

    await fetchLeads();

    alert("Lead deleted successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to delete lead.");
  }
}

}, []);

useEffect(() => {
  setFilteredLeads(
    leads.filter((lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.mobile.includes(search)
    )
  );
}, [search, leads]);

  async function fetchLeads() {
  try {
    const res = await fetch("/api/leads");

    const data = await res.json();

    setLeads(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function deleteLead(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this lead?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete lead");
    }

    await fetchLeads();

    alert("Lead deleted successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to delete lead.");
  }
}

// Load leads when page opens
useEffect(() => {
  fetchLeads();
}, []);

// Filter leads when search changes
useEffect(() => {
  setFilteredLeads(
    leads.filter((lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.mobile.includes(search)
    )
  );
}, [search, leads]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C101D]">

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

        <div>
          <h2 className="text-xl font-bold text-white">
            Recent Leads
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage and track your latest enquiries
          </p>
        </div>
<div className="border-b border-white/10 p-6">
  <div className="relative">

    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
    />

    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by Name or Mobile..."
      className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-12 pr-4 text-white outline-none"
    />

  </div>
</div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400">
          Loading leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-10 text-center text-slate-400">
          No leads found.
        </div>
      ) : (
        <table className="w-full">

          <thead>

            <tr className="border-b border-white/10 text-left">

              <th className="px-6 py-4 text-sm text-slate-400">
                Lead
              </th>

              <th className="text-sm text-slate-400">
                Budget
              </th>

              <th className="text-sm text-slate-400">
                Source
              </th>

              <th className="text-sm text-slate-400">
                Executive
              </th>

              <th className="text-sm text-slate-400">
                Status
              </th>

              <th className="text-center text-sm text-slate-400">
                Actions
              </th>

            </tr>

          </thead>




          <tbody>

            {filteredLeads.map((lead) => (

              <tr
                key={lead.id}
                className="border-b border-white/5 hover:bg-white/[0.03]"
              >

                <td className="px-6 py-5">

                  <p className="font-semibold text-white">
                    {lead.name}
                  </p>

                  <p className="text-sm text-slate-400">
                    {lead.mobile}
                  </p>

                </td>

                <td>
                  {lead.budget
                    ? `₹${lead.budget.toLocaleString()}`
                    : "-"}
                </td>

                <td>
                  {lead.source || "-"}
                </td>

                <td>
                  {lead.assignedTo?.username || "Unassigned"}
                </td>

                <td>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColor[lead.status] ??
                      "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {lead.status}
                  </span>

                </td>

                <td>

                  <div className="flex items-center justify-center gap-3">

                    <button className="rounded-xl p-2 hover:bg-white/5">
                      <Phone size={18} />
                    </button>

                    <button className="rounded-xl p-2 hover:bg-white/5">
                      <MessageCircle size={18} />
                    </button>

                    <button className="rounded-xl p-2 hover:bg-white/5">
                      <Pencil size={18} />
                    </button>

                    <Link
  href={`/admin/leads/${lead.id}`}
  className="rounded-xl p-2 hover:bg-white/5"
>
  <Eye size={18} />
</Link>

<button
  onClick={() => deleteLead(lead.id)}
  className="rounded-xl p-2 text-red-400 transition hover:bg-red-500/10"
>
  <Trash2 size={18} />
</button>



                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
      )}

    </div>
  );
}