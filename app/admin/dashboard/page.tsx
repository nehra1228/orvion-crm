import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { prisma } from "@/lib/prisma";
import { BarChart3, FilePlus, Users, Target } from "lucide-react";

export default async function Dashboard() {
  const totalExecutives = await prisma.user.count({
    where: { role: "EXECUTIVE", active: true },
  });

  const totalLeads = await prisma.lead.count();
  const newLeads = await prisma.lead.count({
    where: { status: "NEW" },
  });
  const assignedLeads = await prisma.lead.count({
    where: { assignedToId: { not: null } },
  });

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { assignedTo: true },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-bold text-white">ORVION CRM</h1>
          <p className="text-slate-400 max-w-2xl">
            Monitor leads, executive performance, and pipeline activity from one place.
          </p>
        </div>

        <DashboardCards
          cards={[
            {
              title: "Active Executives",
              value: totalExecutives,
              description: "Executives available for lead assignment.",
              icon: Users,
              iconClass: "text-blue-400",
            },
            {
              title: "Total Leads",
              value: totalLeads,
              description: "All leads currently in the pipeline.",
              icon: FilePlus,
              iconClass: "text-emerald-400",
            },
            {
              title: "New Leads",
              value: newLeads,
              description: "Leads waiting to be contacted.",
              icon: Target,
              iconClass: "text-violet-400",
            },
            {
              title: "Assigned Leads",
              value: assignedLeads,
              description: "Leads already distributed to executives.",
              icon: BarChart3,
              iconClass: "text-sky-400",
            },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent Leads</h2>
              <p className="text-slate-400">
                The latest leads created in your CRM.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-950">
                    <td className="px-4 py-4 text-white">{lead.name}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.mobile}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.status}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {lead.assignedTo?.username ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
