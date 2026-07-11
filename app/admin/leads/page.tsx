import DashboardLayout from "../../components/dashboard/DashboardLayout";
import LeadTable from "../../components/leads/LeadTable";
import Link from "next/link";
import { Plus, Upload, Download } from "lucide-react";

export default function LeadsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
              ORVION CRM
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              Lead Management
            </h1>

            <p className="mt-2 text-slate-400">
              Manage all your real estate leads from one place.
            </p>
          </div>

          <div className="flex gap-3">

            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-white hover:bg-white/5">
              <Upload size={18} />
              Upload Excel
            </button>

            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-white hover:bg-white/5">
              <Download size={18} />
              Export
            </button>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
            >
              <Plus size={18} />
              New Lead
            </Link>

          </div>

        </div>

        <LeadTable />

      </div>
    </DashboardLayout>
  );
}