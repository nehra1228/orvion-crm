import DashboardLayout from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const totalLeads = await prisma.lead.count();

  const executives = await prisma.user.findMany({
    where: { role: "EXECUTIVE" },
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
    },
  });

  const executiveStats = await Promise.all(
    executives.map(async (exec) => ({
      ...exec,
      totalLeads: await prisma.lead.count({ where: { assignedToId: exec.id } }),
      totalProspects: await prisma.lead.count({
        where: { assignedToId: exec.id, status: "INTERESTED" },
      }),
      totalNotInterested: await prisma.lead.count({
        where: { assignedToId: exec.id, remark: "NOT_INTERESTED" },
      }),
      totalCalls: await prisma.activity.count({ where: { userId: exec.id } }),
    }))
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Reports</p>
          <h1 className="text-4xl font-bold text-white">Lead Insights</h1>
          <p className="text-slate-400 max-w-2xl">
            Review pipeline health and lead status distribution across CRM.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 w-full sm:w-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Leads</p>
              <p className="mt-4 text-4xl font-semibold text-white">{totalLeads}</p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Lead Status Breakdown</h2>
              <p className="text-slate-400">See how your pipeline is progressing by status.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {leadsByStatus.map((group) => (
              <div key={group.status} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{group.status}</p>
                <p className="mt-4 text-4xl font-semibold text-white">{group._count.status}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Executive Performance</h2>
              <p className="text-slate-400">Track call activity and lead outcomes for each executive.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {executiveStats.map((exec) => (
                <div key={exec.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Executive</p>
                      <p className="mt-2 text-xl font-semibold text-white">{exec.username}</p>
                    </div>
                    <div className="rounded-full bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                      Total Calls: {exec.totalCalls}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Leads</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{exec.totalLeads}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Prospects</p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-400">{exec.totalProspects}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Not Interested</p>
                      <p className="mt-2 text-3xl font-semibold text-rose-400">{exec.totalNotInterested}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
