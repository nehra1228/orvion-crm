import DashboardLayout from "@/components/layout/DashboardLayout";
import UserForm from "../components/UserForm";

export default function NewUserPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-8">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Create User</p>
              <h1 className="mt-3 text-4xl font-bold text-white">Add Executive</h1>
              <p className="mt-3 text-slate-400">Create a new executive account with access to ORVION CRM.</p>
            </div>
            <UserForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
