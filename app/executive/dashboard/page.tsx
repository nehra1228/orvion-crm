import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import ExecutiveLeadActions from "@/components/executive/ExecutiveLeadActions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { CalendarDays, DollarSign, MessageSquare, PhoneCall } from "lucide-react";

function normalizePhone(mobile: string) {
  return String(mobile)
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+");
}

function whatsappLink(mobile: string, name: string) {
  const number = normalizePhone(mobile).replace(/^\+/, "");
  const text = encodeURIComponent(`Hi ${name}, I’m calling from Orvion CRM to follow up on your inquiry.`);
  return `https://wa.me/${number}?text=${text}`;
}

type PageProps = {
  searchParams?: { page?: string };
};

export default async function ExecutiveDashboard({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-slate-400">Please log in again to continue.</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentPage = Number(searchParams?.page || "1");
  const pageSize = 50;
  const offset = Math.max(currentPage - 1, 0) * pageSize;

  const assignedLeads = await prisma.lead.findMany({
    where: { assignedToId: user.id },
    orderBy: { updatedAt: "desc" },
    skip: offset,
    take: pageSize,
  });

  const totalAssignedLeads = await prisma.lead.count({
    where: { assignedToId: user.id },
  });

  const totalPages = Math.max(Math.ceil(totalAssignedLeads / pageSize), 1);

  const recentLeads = assignedLeads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    mobile: lead.mobile,
    status: lead.status,
    remark: lead.remark,
    updatedAt: lead.updatedAt.toISOString(),
    followUpDate: lead.followUpDate?.toISOString() ?? null,
  }));

  const followUpCount = await prisma.lead.count({
    where: { assignedToId: user.id, status: "FOLLOW_UP" },
  });

  const interestedCount = await prisma.lead.count({
    where: { assignedToId: user.id, status: "INTERESTED" },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
            Executive Dashboard
          </p>
          <h1 className="text-4xl font-bold text-white">Welcome back, {user.username}</h1>
          <p className="text-slate-400 max-w-2xl">
            Review your current lead assignments, follow-ups, and recent activity.
          </p>
        </div>

        <DashboardCards
          cards={[
            {
              title: "Assigned Leads",
              value: totalAssignedLeads,
              description: "Leads currently assigned to you.",
              icon: PhoneCall,
              iconClass: "text-cyan-400",
            },
            {
              title: "Follow Ups",
              value: followUpCount,
              description: "Leads that need your next call.",
              icon: CalendarDays,
              iconClass: "text-amber-400",
            },
            {
              title: "Interested Leads",
              value: interestedCount,
              description: "Hot leads ready for closing.",
              icon: DollarSign,
              iconClass: "text-emerald-400",
            },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Your Recent Leads</h2>
                <p className="text-slate-400">The latest leads assigned to you. Choose a remark and share interested leads with the admin team.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-400">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`/executive/dashboard?page=${Math.max(currentPage - 1, 1)}`}
                    className="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                  >
                    Back
                  </a>
                  <a
                    href={`/executive/dashboard?page=${Math.min(currentPage + 1, totalPages)}`}
                    className="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                  >
                    Next
                  </a>
                </div>
              </div>
            </div>
            <ExecutiveLeadActions initialLeads={recentLeads} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
