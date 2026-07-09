import DashboardLayout from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: true },
    take: 50,
  });

  const totalLeads = leads.length;
  const unassignedLeads = leads.filter((lead) => !lead.assignedToId).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
            Lead Management
          </p>
          <h1 className="text-4xl font-bold text-white">Lead List</h1>
          <p className="text-slate-400 max-w-2xl">
            Review recent leads, assigned executives, and pipeline status from one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Leads</p>
            <p className="mt-4 text-4xl font-semibold text-white">{totalLeads}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Unassigned</p>
            <p className="mt-4 text-4xl font-semibold text-white">{unassignedLeads}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Latest Updated</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {leads[0] ? formatDate(leads[0].updatedAt) : "-"}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Lead Table</h2>
              <p className="text-slate-400">Manage lead assignments, status, and follow-up dates.</p>
            </div>
            <div className="text-slate-400">Showing up to 50 most recently updated leads.</div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-950">
                    <td className="px-4 py-4 text-white">{lead.name}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.mobile}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.project ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.status}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.assignedTo?.username ?? "Unassigned"}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(lead.followUpDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="p-6 text-center text-slate-400">No leads available yet.</div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
