"use client"

import { useMemo, useState } from "react";
import { MessageSquare, PhoneCall, Save } from "lucide-react";

type ExecutiveLead = {
  id: string;
  name: string;
  mobile: string;
  status: string;
  remark: string | null;
  updatedAt: string;
  followUpDate: string | null;
};

type Props = {
  initialLeads: ExecutiveLead[];
};

const remarkOptions = [
  { value: "", label: "Choose remark" },
  { value: "INTERESTED", label: "Interested" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "CALLBACK", label: "Callback" },
  { value: "BUSY", label: "Busy" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "WRONG_NUMBER", label: "Wrong Number" },
  { value: "SITE_VISIT", label: "Site Visit" },
  { value: "BOOKED", label: "Booked" },
  { value: "LOST", label: "Lost" },
];

function normalizePhone(mobile: string) {
  return String(mobile).trim().replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function whatsappLink(mobile: string, name: string) {
  const number = normalizePhone(mobile).replace(/^\+/, "");
  const text = encodeURIComponent(`Hi ${name}, I’m calling from Orvion CRM to follow up on your inquiry.`);
  return `https://wa.me/${number}?text=${text}`;
}

export default function ExecutiveLeadActions({ initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [remarkSelection, setRemarkSelection] = useState<Record<string, string>>(
    Object.fromEntries(initialLeads.map((lead) => [lead.id, lead.remark || ""]))
  );
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shareFlag = useMemo(
    () => Object.fromEntries(initialLeads.map((lead) => [lead.id, lead.remark === "INTERESTED"])),
    [initialLeads]
  );

  async function handleSave(leadId: string) {
    const remark = remarkSelection[leadId];

    if (!remark) {
      setStatusMessage("Please choose a remark before saving.");
      return;
    }

    setSavingLeadId(leadId);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/executive/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId, remark }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result?.message || "Failed to save remark.");
        return;
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                remark,
                status: result.lead.status,
                updatedAt: result.lead.updatedAt,
              }
            : lead
        )
      );

      setStatusMessage("Remark updated successfully.");
    } catch (error) {
      setStatusMessage("Failed to save remark. Please try again.");
    } finally {
      setSavingLeadId(null);
    }
  }

  return (
    <div className="space-y-4">
      {statusMessage ? <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">{statusMessage}</div> : null}

      <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-950">
                <td className="px-4 py-4 text-white">{lead.name}</td>
                <td className="px-4 py-4 text-slate-300">
                  <div className="flex flex-col gap-2">
                    <span>{lead.mobile}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${normalizePhone(lead.mobile)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={whatsappLink(lead.mobile, lead.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300">{lead.status}</td>
                <td className="px-4 py-4 text-slate-300">
                  <select
                    value={remarkSelection[lead.id] ?? ""}
                    onChange={(event) =>
                      setRemarkSelection((current) => ({
                        ...current,
                        [lead.id]: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  >
                    {remarkOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {shareFlag[lead.id] || remarkSelection[lead.id] === "INTERESTED" ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                      <span>Shared to admin</span>
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <button
                    type="button"
                    onClick={() => handleSave(lead.id)}
                    disabled={savingLeadId === lead.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingLeadId === lead.id ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Lead</p>
                <p className="text-lg font-semibold text-white">{lead.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${normalizePhone(lead.mobile)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Call
                </a>
                <a
                  href={whatsappLink(lead.mobile, lead.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-slate-300">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Status</span>
                  <span>{lead.status}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Updated</span>
                  <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Remark</label>
                <select
                  value={remarkSelection[lead.id] ?? ""}
                  onChange={(event) =>
                    setRemarkSelection((current) => ({
                      ...current,
                      [lead.id]: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                >
                  {remarkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {(shareFlag[lead.id] || remarkSelection[lead.id] === "INTERESTED") && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                    Shared to admin
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSave(lead.id)}
                  disabled={savingLeadId === lead.id}
                  className="w-full rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingLeadId === lead.id ? "Saving…" : "Save Remark"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
