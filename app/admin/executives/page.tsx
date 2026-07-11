import DashboardLayout from "../../components/dashboard/DashboardLayout";

export default function ExecutivesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            ORVION CRM
          </p>

          <h1 className="mt-2 text-4xl font-bold text-white">
            Executive Management
          </h1>

          <p className="mt-2 text-slate-400">
            Manage sales executives and assign leads.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}