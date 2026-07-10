import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { prisma } from "@/lib/prisma";
import { BarChart3, FilePlus, Users, Target } from "lucide-react";
import WelcomeCard from "./components/WelcomeCard";
import DashboardChart from "./components/DashboardChart";
import ExecutiveLeaderboard from "./components/ExecutiveLeaderboard";
import RecentActivity from "./components/RecentActivity";
import LeadSourceChart from "./components/LeadSourceChart";
import QuickActions from "./components/QuickActions";
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

      <WelcomeCard />

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

                <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardChart />
          </div>

          <ExecutiveLeaderboard />

          <div className="xl:col-span-2">
            <RecentActivity recentLeads={recentLeads} />
          </div>

          <LeadSourceChart />
        </div>

        <QuickActions />
      </div>
    </DashboardLayout>
  );
}