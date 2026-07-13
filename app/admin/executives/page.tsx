"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

type Executive = {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  _count: {
    leads: number;
  };
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
    try {
      const res = await fetch("/api/admin/users");

      if (!res.ok) {
        throw new Error("Failed to fetch executives");
      }

      const data = await res.json();

      const onlyExecutives = data.filter(
        (user: any) => user.role === "EXECUTIVE"
      );

      setExecutives(onlyExecutives);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExecutives();
  }, []);

  const filteredExecutives = useMemo(() => {
    return executives.filter((user) => {
      return (
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [executives, search]);

  const totalExecutives = executives.length;

  const totalLeads = executives.reduce(
  (sum, item) => sum + (item._count?.leads ?? 0),
  0
);

  const activeExecutives = executives.filter(
    (item) => item.active
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">
              ORVION CRM
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              Executive Management
            </h1>

            <p className="mt-2 text-slate-400">
              Manage executives, monitor workload and assign leads.
            </p>

          </div>

          <button
  onClick={() => setShowModal(true)}
            className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-cyan-500
            px-5
            py-3
            font-semibold
            text-slate-950
            transition
            hover:bg-cyan-400
            "
          >
            <UserPlus size={18} />

            Add Executive

          </button>

        </div>

        {/* Stats */}

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total Executives
                </p>

                <h2 className="mt-3 text-4xl font-bold text-white">
                  {totalExecutives}
                </h2>

              </div>

              <Users
                size={34}
                className="text-cyan-400"
              />

            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Assigned Leads
                </p>

                <h2 className="mt-3 text-4xl font-bold text-white">
                  {totalLeads}
                </h2>

              </div>

              <Briefcase
                size={34}
                className="text-green-400"
              />

            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Active Users
                </p>

                <h2 className="mt-3 text-4xl font-bold text-white">
                  {activeExecutives}
                </h2>

              </div>

              <CheckCircle2
                size={34}
                className="text-emerald-400"
              />

            </div>

          </div>

        </div>
                {/* Search */}

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">

          <div className="relative max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search executive..."
              className="
              w-full
              rounded-xl
              border
              border-white/10
              bg-[#0B1220]
              py-3
              pl-11
              pr-4
              text-white
              outline-none
              focus:border-cyan-500
              "
            />

          </div>

        </div>

        {/* Executive Table */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">

          {loading ? (

            <div className="p-16 text-center text-slate-400">
              Loading executives...
            </div>

          ) : filteredExecutives.length === 0 ? (

            <div className="p-16 text-center text-slate-400">
              No executives found.
            </div>

          ) : (

            <table className="w-full">

              <thead>

                <tr className="border-b border-white/10 text-left">

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Executive
                  </th>

                  <th className="text-sm text-slate-400">
                    Contact
                  </th>

                  <th className="text-sm text-slate-400">
                    Leads
                  </th>

                  <th className="text-sm text-slate-400">
                    Status
                  </th>

                  <th className="text-center text-sm text-slate-400">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>
                                {filteredExecutives.map((user) => (

                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        <div
                          className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          bg-cyan-500/20
                          text-lg
                          font-bold
                          text-cyan-400
                          "
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>

                        <div>

                          <p className="font-semibold text-white">
                            {user.username}
                          </p>

                          <p className="text-sm text-slate-400">
                            Joined{" "}
                            {new Date(
                              user.createdAt
                            ).toLocaleDateString()}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td>

                      <div>

                        <p className="text-white">
                          {user.email}
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Phone
                            size={15}
                            className="text-cyan-400"
                          />

                          <span className="text-sm text-slate-400">
                            Executive
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>

                      <span
                        className="
                        rounded-full
                        bg-cyan-500/20
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-cyan-400
                        "
                      >
                        {user._count?.leads ?? 0} Leads
                      </span>

                    </td>

                    <td>

                      {user.active ? (

                        <span
                          className="
                          rounded-full
                          bg-green-500/20
                          px-3
                          py-1
                          text-sm
                          font-semibold
                          text-green-400
                          "
                        >
                          Active
                        </span>

                      ) : (

                        <span
                          className="
                          rounded-full
                          bg-red-500/20
                          px-3
                          py-1
                          text-sm
                          font-semibold
                          text-red-400
                          "
                        >
                          Disabled
                        </span>

                      )}

                    </td>

                    <td>

                      <div className="flex justify-center gap-2">
                                              <button
                          className="
                          rounded-xl
                          bg-cyan-500/20
                          px-3
                          py-2
                          text-sm
                          font-medium
                          text-cyan-400
                          transition
                          hover:bg-cyan-500/30
                          "
                        >
                          Assign Leads
                        </button>

                        <button
                          className="
                          rounded-xl
                          bg-yellow-500/20
                          px-3
                          py-2
                          text-sm
                          font-medium
                          text-yellow-400
                          transition
                          hover:bg-yellow-500/30
                          "
                        >
                          Reset Password
                        </button>

                        <button
                          className="
                          rounded-xl
                          bg-red-500/20
                          px-3
                          py-2
                          text-sm
                          font-medium
                          text-red-400
                          transition
                          hover:bg-red-500/30
                          "
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>
        {/* Add Executive Modal */}

{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-8">

      <h2 className="text-2xl font-bold text-white">
        Add Executive
      </h2>

      <div className="mt-6 space-y-4">

        <input
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none"
        />

        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none"
        />

        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-3 text-white outline-none"
        />

      </div>

      <div className="mt-8 flex justify-end gap-3">

        <button
          onClick={() => setShowModal(false)}
          className="rounded-xl border border-white/10 px-5 py-3 text-white"
        >
          Cancel
        </button>

        <button
          onClick={async () => {

            const res = await fetch("/api/admin/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: newUsername,
                email: newEmail,
                password: newPassword,
                role: "EXECUTIVE",
              }),
            });

            if (res.ok) {

              setShowModal(false);

              setNewUsername("");

              setNewEmail("");

              setNewPassword("");

              fetchExecutives();

            } else {

              alert("Unable to create executive.");

            }

          }}
          className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
        >
          Create Executive
        </button>

      </div>

    </div>

  </div>
)}
      </div>
    </DashboardLayout>
  );
}