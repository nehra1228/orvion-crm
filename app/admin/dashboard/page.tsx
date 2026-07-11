"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import WelcomeCard from "./components/WelcomeCard";
import LeadTable from "@/app/components/leads/LeadTable";
import AddLeadModal from "@/app/components/leads/AddLeadModal";
import StatsCard from "./components/StatsCard";
import MonthlyLeadsChart from "./components/MonthlyLeadsChart";
import LeadSourceChart from "./components/LeadSourceChart";
import ExecutiveLeaderboard from "./components/ExecutiveLeaderboard";

export default function DashboardPage() {
  const [openLeadModal, setOpenLeadModal] = useState(false);

  return (
  <DashboardLayout>
    <div className="space-y-8">

      <WelcomeCard
  onCreateLead={() => setOpenLeadModal(true)}
/>

<StatsCard />

<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
  <MonthlyLeadsChart />
  <LeadSourceChart />
</div>

<ExecutiveLeaderboard />

<LeadTable />

<AddLeadModal
  open={openLeadModal}
  onClose={() => setOpenLeadModal(false)}
/>

    </div>
  </DashboardLayout>
);
}