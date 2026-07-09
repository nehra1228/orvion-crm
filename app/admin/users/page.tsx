import DashboardLayout from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";
import UserForm from "./components/UserForm";
import UserTable from "./components/UserTable";

async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const executiveCount = users.filter((user) => user.role === "EXECUTIVE").length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">User Management</p>
          <h1 className="text-4xl font-bold text-white">Team Members</h1>
          <p className="text-slate-400 max-w-2xl">
            Manage admin and executive accounts inside the CRM.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admins</p>
            <p className="mt-4 text-4xl font-semibold text-white">{adminCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Executives</p>
            <p className="mt-4 text-4xl font-semibold text-white">{executiveCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Users</p>
            <p className="mt-4 text-4xl font-semibold text-white">{users.length}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <UserForm />

          <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">User Accounts</h2>
                <p className="text-slate-400">View role and activation status for each team member.</p>
              </div>
            </div>

            <UserTable users={users.map((user) => ({
              id: user.id,
              username: user.username,
              role: user.role,
              active: user.active,
              createdAt: user.createdAt.toISOString(),
            }))} />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
