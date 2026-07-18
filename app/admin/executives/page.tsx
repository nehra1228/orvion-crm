"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Briefcase,
  CheckCircle2,
  Phone,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Executive = {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  _count?: { leads: number };
};

export default function ExecutivesPage() {
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchExecutives() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch executives");

      const data = await res.json();

      setExecutives(
        Array.isArray(data)
          ? data.filter((user: any) => user.role === "EXECUTIVE")
          : []
      );
    } catch (error) {
      console.error(error);
      setExecutives([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExecutives();
  }, []);

  const filteredExecutives = useMemo(() => {
    const term = search.trim().toLowerCase();

    return executives.filter(
      (user) =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [executives, search]);

  const totalLeads = executives.reduce(
    (sum, executive) => sum + (executive._count?.leads ?? 0),
    0
  );

  const activeExecutives = executives.filter(
    (executive) => executive.active
  ).length;

  function closeModal() {
    setShowModal(false);
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <header className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-[#111827] p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 sm:text-sm sm:tracking-[0.35em]">
              ORVION CRM
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Executive Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Manage executives, monitor workload and assign leads.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 sm:w-auto sm:px-5"
          >
            <UserPlus size={18} />
            Add Executive
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <StatCard
            label="Total Executives"
            value={executives.length}
            icon={<Users size={30} className="text-cyan-400 sm:h-[34px] sm:w-[34px]" />}
          />

          <StatCard
            label="Assigned Leads"
            value={totalLeads}
            icon={<Briefcase size={30} className="text-green-400 sm:h-[34px] sm:w-[34px]" />}
          />

          <StatCard
            label="Active Users"
            value={activeExecutives}
            icon={<CheckCircle2 size={30} className="text-emerald-400 sm:h-[34px] sm:w-[34px]" />}
            className="min-[460px]:col-span-2 lg:col-span-1"
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111827] p-4 sm:p-5">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search executive..."
              className="w-full rounded-xl border border-white/10 bg-[#0B1220] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          {loading ? (
            <div className="p-10 text-center text-slate-400 sm:p-16">
              Loading executives...
            </div>
          ) : filteredExecutives.length === 0 ? (
            <div className="p-10 text-center text-slate-400 sm:p-16">
              No executives found.
            </div>
          ) : (
            <div>
              <div className="space-y-4 p-4 sm:hidden">
                {filteredExecutives.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-base font-bold text-cyan-400">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-white">
                            {user.username}
                          </p>
                          <p className="text-sm text-slate-400">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                          user.active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-sm text-slate-400">Contact</p>
                        <p className="truncate text-white">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={15} className="text-cyan-400" />
                        <span className="text-sm text-slate-400">Executive</span>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Leads</p>
                        <span className="inline-flex rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-400">
                          {user._count?.leads ?? 0} Leads
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button className="flex-1 min-w-[120px] rounded-xl bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/30">
                          Assign Leads
                        </button>
                        <button className="flex-1 min-w-[120px] rounded-xl bg-yellow-500/20 px-3 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/30">
                          Reset Password
                        </button>
                        <button className="flex-1 min-w-[120px] rounded-xl bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden sm:block w-full max-w-full overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[840px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-4 text-sm font-medium text-slate-400 sm:px-6">
                        Executive
                      </th>
                      <th className="px-4 py-4 text-sm font-medium text-slate-400">
                        Contact
                      </th>
                      <th className="px-4 py-4 text-sm font-medium text-slate-400">
                        Leads
                      </th>
                      <th className="px-4 py-4 text-sm font-medium text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-medium text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExecutives.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-5 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-base font-bold text-cyan-400 sm:h-12 sm:w-12 sm:text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate font-semibold text-white">
                                {user.username}
                              </p>
                              <p className="text-sm text-slate-400">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="max-w-[230px] truncate text-white">
                            {user.email}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <Phone size={15} className="text-cyan-400" />
                            <span className="text-sm text-slate-400">
                              Executive
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span className="whitespace-nowrap rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-400">
                            {user._count?.leads ?? 0} Leads
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                              user.active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {user.active ? "Active" : "Disabled"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex justify-center gap-2">
                            <button className="whitespace-nowrap rounded-xl bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/30">
                              Assign Leads
                            </button>
                            <button className="whitespace-nowrap rounded-xl bg-yellow-500/20 px-3 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/30">
                              Reset Password
                            </button>
                            <button className="whitespace-nowrap rounded-xl bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#111827] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Add Executive
              </h2>

              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <input
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
                placeholder="Username"
                className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none transition focus:border-cyan-500"
              />

              <input
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none transition focus:border-cyan-500"
              />

              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="min-h-11 rounded-xl border border-white/10 px-5 py-3 text-white transition hover:bg-white/5"
              >
                Cancel
              </button>

              <CreateExecutiveButton
                newUsername={newUsername}
                newEmail={newEmail}
                newPassword={newPassword}
                onSuccess={() => {
                  closeModal();
                  fetchExecutives();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {value}
          </h2>
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function CreateExecutiveButton({
  newUsername,
  newEmail,
  newPassword,
  onSuccess,
}: {
  newUsername: string;
  newEmail: string;
  newPassword: string;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createExecutive() {
    if (!newUsername.trim() || !newPassword) {
      setError("Username and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: "EXECUTIVE",
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          body?.message ||
            body?.error ||
            `Failed to create user (status ${res.status})`
        );
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Network error: could not create user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      {error && <p className="text-sm text-rose-300">{error}</p>}

      <button
        onClick={createExecutive}
        disabled={submitting}
        className="min-h-11 w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Creating..." : "Create Executive"}
      </button>
    </div>
  );
}