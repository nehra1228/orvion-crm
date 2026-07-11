"use client";

import { useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import WelcomeCard from "./components/WelcomeCard";
import LeadTable from "@/app/components/leads/LeadTable";
import AddLeadModal from "@/app/components/leads/AddLeadModal";
import StatsCard from "./components/StatsCard";

export default function DashboardPage() {
  const [openLeadModal, setOpenLeadModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        <WelcomeCard
  onCreateLead={() => setOpenLeadModal(true)}
/>

<StatsCard />

<LeadTable />

<AddLeadModal
  open={openLeadModal}
  onClose={() => setOpenLeadModal(false)}
/>

      </div>
    </DashboardLayout>
  );
}