import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ExecutiveWorkspacePage({ params, searchParams }: PageProps) {
  const { id } = await params;

  const page = Number(Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page) || 1;
  const pageSize = Number(Array.isArray(searchParams?.pageSize) ? searchParams.pageSize[0] : searchParams?.pageSize) || 20;

  const executive = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  if (!executive || executive.role !== "EXECUTIVE") {
    notFound();
  }

  const total = await prisma.lead.count({ where: { assignedToId: id } });
  const interestedTotal = await prisma.lead.count({ where: { assignedToId: id, status: "INTERESTED" } });
  const followUpsTotal = await prisma.lead.count({ where: { assignedToId: id, status: "FOLLOW_UP" } });

  const leads = await prisma.lead.findMany({
    where: { assignedToId: id },
    select: { id: true, name: true, mobile: true, project: true, status: true, remark: true, followUpDate: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Today's range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayLeadsCount = await prisma.lead.count({
    where: { assignedToId: id, createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  const todayCallsCount = await prisma.call.count({
    where: { executiveId: id, startedAt: { gte: startOfDay, lte: endOfDay } },
  });

  const totalCalls = await prisma.call.count({ where: { executiveId: id } });
  const avgDurationRes = await prisma.call.aggregate({ _avg: { duration: true }, where: { executiveId: id } });
  const avgDuration = Math.round((avgDurationRes._avg.duration ?? 0) as number);
  const recentCalls = await prisma.call.findMany({
    where: { executiveId: id },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      duration: true,
      outcome: true,
      startedAt: true,
      lead: { select: { id: true, name: true, mobile: true } },
    },
  });
  const execState = await prisma.executiveState.findUnique({ where: { userId: id } });

  // Split leads for workspace: interested and follow-ups
  const interested = leads.filter((l) => l.status === "INTERESTED");
  const followUps = leads.filter((l) => l.status === "FOLLOW_UP");

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/executives" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.02] px-3 py-1 text-sm font-medium text-slate-300 hover:bg-white/[.03]">
                <span aria-hidden>←</span>
                <span>Back</span>
              </Link>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white">{executive.username} workspace</h1>
          <p className="mt-2 text-sm text-slate-400">Qualified leads & follow-ups — admin view for this executive.</p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 md:col-span-1">
              <h3 className="text-sm font-semibold text-slate-300">Calling</h3>
              <div className="mt-3 space-y-2">
                <p className="text-lg font-bold text-white">{totalCalls}</p>
                <p className="text-xs text-slate-400">Total calls</p>
                <p className="mt-3 text-sm text-slate-300">Avg duration: <span className="font-medium">{avgDuration}s</span></p>
                <p className="text-sm text-slate-300">Status: <span className="font-medium">{execState?.status ?? 'OFFLINE'}</span></p>
                {execState?.currentCall ? <p className="text-sm text-slate-300">On call: {execState.currentCall}</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300">Recent calls</h3>
              <div className="mt-3 space-y-2">
                {recentCalls.length === 0 ? (
                  <p className="text-sm text-slate-400">No recent calls.</p>
                ) : (
                  recentCalls.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-slate-950/50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{c.lead?.name || '—'}</p>
                        <p className="mt-1 text-xs text-slate-400">{c.outcome || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">{c.duration ? `${c.duration}s` : '—'}</p>
                        <p className="mt-1 text-xs text-slate-500">{c.startedAt ? new Date(c.startedAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-sm text-slate-400">Today's leads</p>
              <p className="mt-2 text-2xl font-bold text-white">{todayLeadsCount}</p>
              <p className="mt-1 text-xs text-slate-500">New leads assigned today</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-sm text-slate-400">Calling data</p>
              <p className="mt-2 text-2xl font-bold text-white">{todayCallsCount}</p>
              <p className="mt-1 text-xs text-slate-500">Calls today</p>
              <div className="mt-3 space-y-2">
                {recentCalls.length === 0 ? (
                  <p className="text-xs text-slate-400">No recent calls</p>
                ) : (
                  recentCalls.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs text-slate-300">
                      <span>{c.lead?.mobile || '—'}</span>
                      <span className="text-slate-500">{c.duration ? `${c.duration}s` : ''}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-sm text-slate-400">Leads workspace</p>
              <p className="mt-2 text-2xl font-bold text-white">{total}</p>
              <p className="mt-1 text-xs text-slate-500">Total workspace leads</p>
              <div className="mt-3 flex gap-2 text-xs text-slate-300">
                <div className="rounded-md bg-white/[.02] px-2 py-1">Interested {interestedTotal}</div>
                <div className="rounded-md bg-white/[.02] px-2 py-1">Follow-ups {followUpsTotal}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="rounded-2xl border border-white/10 bg-white/[.02] px-4 py-2 text-sm font-semibold">Select all</button>
                <button className="rounded-2xl border border-white/10 bg-white/[.02] px-4 py-2 text-sm font-semibold text-rose-200">Delete selected</button>
                <button className="rounded-2xl border border-white/10 bg-white/[.02] px-4 py-2 text-sm font-semibold">Delete all</button>
              </div>
              <div className="w-1/3">
                <input placeholder="Search workspace" className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-sm text-slate-300" />
              </div>
            </div>

            <div className="mt-6">
              {interested.length + followUps.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-12 text-center text-slate-400">No workspace leads. Interested leads and saved follow-ups will appear here.</div>
              ) : (
                <div className="mt-2 space-y-3">
                  {[...followUps, ...interested].map((lead) => (
                    <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-slate-950/50 px-5 py-4 hover:bg-slate-900/50">
                      <div>
                        <p className="text-sm font-semibold text-white">{lead.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{lead.mobile || "—"} · {lead.project || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">{lead.remark || lead.status}</p>
                        <p className="mt-1 text-xs text-slate-500">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <div>
                  Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/executives/${id}?page=${Math.max(1, page - 1)}&pageSize=${pageSize}`} className="rounded-full border border-white/10 px-3 py-1 text-sm">Prev</Link>
                    <div className="px-2">{page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
                    <Link href={`/admin/executives/${id}?page=${Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1)}&pageSize=${pageSize}`} className="rounded-full border border-white/10 px-3 py-1 text-sm">Next</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/executives/${id}?page=1&pageSize=20`} className={pageSize === 20 ? "font-semibold text-white" : "text-slate-300"}>20 rows</Link>
                    <Link href={`/admin/executives/${id}?page=1&pageSize=50`} className={pageSize === 50 ? "font-semibold text-white" : "text-slate-300"}>50 rows</Link>
                    <Link href={`/admin/executives/${id}?page=1&pageSize=100`} className={pageSize === 100 ? "font-semibold text-white" : "text-slate-300"}>100 rows</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
