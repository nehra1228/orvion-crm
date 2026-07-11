"use client";

import { useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import WelcomeCard from "./components/WelcomeCard";
import LeadTable from "@/app/components/leads/LeadTable";
import AddLeadModal from "@/app/components/leads/AddLeadModal";
import {
  Users,
  UserPlus,
  PhoneCall,
  IndianRupee,
} from "lucide-react";

export default function DashboardPage() {
  const [openLeadModal, setOpenLeadModal] = useState(false);

  const stats = [
    {
      title: "Total Leads",
      value: "248",
      icon: Users,
    },
    {
      title: "Today's Leads",
      value: "18",
      icon: UserPlus,
    },
    {
      title: "Follow Ups",
      value: "37",
      icon: PhoneCall,
    },
    {
      title: "Revenue",
      value: "₹2.41 Cr",
      icon: IndianRupee,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        <WelcomeCard
          onCreateLead={() => setOpenLeadModal(true)}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-[#0C101D] p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      {item.title}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-white">
                      {item.value}
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-blue-500/20 p-4">
                    <Icon
                      className="text-blue-400"
                      size={26}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <LeadTable />

        <AddLeadModal
          open={openLeadModal}
          onClose={() => setOpenLeadModal(false)}
        />

      </div>
    </DashboardLayout>
  );
}