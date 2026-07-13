"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Phone,
  MessageCircle,
  Pencil,
  Eye,
  Trash2,
  Users,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  mobile: string;
  budget?: number | null;
  source?: string | null;
  status: string;

  assignedTo?: {
    id?: string;
    username: string;
  } | null;
}

interface Executive {
  id: string;
  username: string;
}

const statusColor: Record<string, string> = {
  NEW: "bg-cyan-500/20 text-cyan-300",
  CALLED: "bg-blue-500/20 text-blue-300",
  INTERESTED: "bg-green-500/20 text-green-300",
  FOLLOW_UP: "bg-yellow-500/20 text-yellow-300",
  SITE_VISIT: "bg-purple-500/20 text-purple-300",
  NEGOTIATION: "bg-orange-500/20 text-orange-300",
  BOOKED: "bg-emerald-500/20 text-emerald-300",
  LOST: "bg-red-500/20 text-red-300",
};

export default function LeadTable() {

  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [search, setSearch] = useState("");

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const [executives, setExecutives] = useState<Executive[]>([]);

  const [selectedExecutive, setSelectedExecutive] = useState("");

  async function fetchLeads() {
    try {

      const res = await fetch("/api/leads");

if (!res.ok) {
  throw new Error(`API Error: ${res.status}`);
}

const text = await res.text();

console.log(text);

const data = JSON.parse(text);

      setLeads(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExecutives() {
    try {

      const res = await fetch("/api/users");

      if (!res.ok) return;

      const data = await res.json();

      setExecutives(data);

    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchLeads();
    fetchExecutives();
  }, []);

  const filteredLeads = useMemo(() => {

    return leads.filter((lead) => {

      const keyword = search.toLowerCase();

      return (
        lead.name.toLowerCase().includes(keyword) ||

        lead.mobile.includes(keyword) ||

        (lead.source ?? "").toLowerCase().includes(keyword) ||

        lead.status.toLowerCase().includes(keyword) ||

        (lead.assignedTo?.username ?? "")
          .toLowerCase()
          .includes(keyword)
      );

    });

  }, [search, leads]);

  function toggleLead(id: string) {

    setSelectedLeads((prev) =>

      prev.includes(id)

        ? prev.filter((item) => item !== id)

        : [...prev, id]

    );

  }

  function toggleAll() {

    if (selectedLeads.length === filteredLeads.length) {

      setSelectedLeads([]);

    } else {

      setSelectedLeads(
        filteredLeads.map((lead) => lead.id)
      );

    }

  }

  async function deleteLead(id: string) {

    const ok = window.confirm(
      "Delete this lead?"
    );

    if (!ok) return;

    try {

      await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      fetchLeads();

    } catch (err) {

      console.error(err);

    }

  }

  async function deleteSelected() {

    if (selectedLeads.length === 0) return;

    const ok = window.confirm(
      `Delete ${selectedLeads.length} selected leads?`
    );

    if (!ok) return;

    for (const id of selectedLeads) {

      await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

    }

    setSelectedLeads([]);

    fetchLeads();

  }

  async function assignExecutive() {

    if (!selectedExecutive) return;

    if (selectedLeads.length === 0) return;

    await fetch("/api/leads/bulk-assign", {

      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        executiveId: selectedExecutive,

        leadIds: selectedLeads,

      }),

    });

    setSelectedLeads([]);

    fetchLeads();

  }

  return (

    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C101D]">
            {/* Header */}

      <div className="flex flex-col gap-6 border-b border-white/10 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            ORVION CRM
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Recent Leads
          </h2>

          <p className="mt-2 text-slate-400">
            Manage and track all real estate enquiries.
          </p>

        </div>

        <div className="w-full max-w-sm">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name, Mobile, Source..."
              className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-12 pr-4 text-white outline-none transition focus:border-cyan-500"
            />

          </div>

        </div>

      </div>

      {/* Bulk Actions */}

      {selectedLeads.length > 0 && (

        <div className="flex flex-col gap-4 border-b border-white/10 bg-[#101827] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 font-bold text-slate-950">

              {selectedLeads.length}

            </div>

            <p className="text-white">

              Lead{selectedLeads.length > 1 ? "s" : ""} Selected

            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="relative">

              <select
                value={selectedExecutive}
                onChange={(e) =>
                  setSelectedExecutive(e.target.value)
                }
                className="rounded-lg border border-white/10 bg-[#0C101D] py-2 pl-4 pr-10 text-white outline-none"
              >

                <option value="">
                  Assign Executive
                </option>

                {executives.map((executive) => (

                  <option
                    key={executive.id}
                    value={executive.id}
                  >
                    {executive.username}
                  </option>

                ))}

              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

            </div>

            <button
              onClick={assignExecutive}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Users size={18} />
              Assign
            </button>

            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-400"
            >
              <Trash2 size={18} />
              Delete Selected
            </button>

            <button
              onClick={() => setSelectedLeads([])}
              className="rounded-lg border border-white/10 px-4 py-2 text-white transition hover:bg-white/5"
            >
              Clear
            </button>

          </div>

        </div>

      )}
            {loading ? (

        <div className="flex items-center justify-center py-24">

          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />

        </div>

      ) : filteredLeads.length === 0 ? (

        <div className="py-24 text-center">

          <p className="text-lg font-semibold text-white">
            No Leads Found
          </p>

          <p className="mt-2 text-slate-400">
            Try another search or add a new lead.
          </p>

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b border-white/10 bg-[#111827]">

                <th className="w-14 px-6 py-4">

                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.length > 0 &&
                      selectedLeads.length === filteredLeads.length
                    }
                    onChange={toggleAll}
                    className="h-4 w-4 accent-cyan-500"
                  />

                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                  Lead
                </th>

                <th className="text-left text-sm font-semibold text-slate-400">
                  Budget
                </th>

                <th className="text-left text-sm font-semibold text-slate-400">
                  Source
                </th>

                <th className="text-left text-sm font-semibold text-slate-400">
                  Executive
                </th>

                <th className="text-left text-sm font-semibold text-slate-400">
                  Status
                </th>

                <th className="text-center text-sm font-semibold text-slate-400">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>
                            {filteredLeads.map((lead) => (

                <tr
                  key={lead.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]"
                >

                  <td className="px-6 py-5">

                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="h-4 w-4 accent-cyan-500"
                    />

                  </td>

                  <td className="px-6 py-5">

                    <div>

                      <p className="font-semibold text-white">
                        {lead.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {lead.mobile}
                      </p>

                    </div>

                  </td>

                  <td className="text-slate-300">

                    {lead.budget
                      ? `₹${lead.budget.toLocaleString()}`
                      : "-"}

                  </td>

                  <td className="text-slate-300">

                    {lead.source || "-"}

                  </td>

                  <td className="text-slate-300">

                    {lead.assignedTo?.username || "Unassigned"}

                  </td>

                  <td>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColor[lead.status] ??
                        "bg-slate-600/20 text-slate-300"
                      }`}
                    >
                      {lead.status.replaceAll("_", " ")}
                    </span>

                  </td>

                  <td>

                    <div className="flex items-center justify-center gap-2">

                      <a
                        href={`tel:${lead.mobile}`}
                        className="rounded-lg p-2 transition hover:bg-white/5"
                      >
                        <Phone size={18} />
                      </a>

                      <a
                        href={`https://wa.me/${lead.mobile}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 transition hover:bg-white/5"
                      >
                        <MessageCircle size={18} />
                      </a>

                      <Link
                        href={`/admin/leads/${lead.id}/edit`}
                        className="rounded-lg p-2 transition hover:bg-white/5"
                      >
                        <Pencil size={18} />
                      </Link>

                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="rounded-lg p-2 transition hover:bg-white/5"
                      >
                        <Eye size={18} />
                      </Link>

                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}
                          </tbody>

          </table>

        </div>

      )}

      <div className="flex items-center justify-between border-t border-white/10 bg-[#111827] px-6 py-4">

        <p className="text-sm text-slate-400">

          Showing

          <span className="mx-1 font-semibold text-white">
            {filteredLeads.length}
          </span>

          lead{filteredLeads.length !== 1 ? "s" : ""}

        </p>

        <button
          onClick={fetchLeads}
          className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
        >
          Refresh
        </button>

      </div>

    </div>

  );

}