"use client";
import EditUserModal from "./EditUserModal";
import PasswordModal from "./PasswordModal";
import DeleteUserModal from "./DeleteUserModal";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Pencil,
  Trash2,
  KeyRound,
  Database,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import RoleBadge from "./RoleBadge";

type UserRow = {
  id: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
};

export default function UserTable({
  users,
}: {
  users: UserRow[];
}) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

const [editOpen, setEditOpen] = useState(false);
const [passwordOpen, setPasswordOpen] = useState(false);
const [deleteOpen, setDeleteOpen] = useState(false);
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  async function handleDeleteLeads(userId: string, username: string) {
    if (!confirm(`Delete all leads assigned to ${username}?`)) return;

    setLoadingUserId(userId);

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/leads`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
        return;
      }

      toast.success(`${data.deleted} leads deleted`);

      location.reload();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoadingUserId(null);
    }
  }

  

  

  

  return (
  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

    <div className="border-b border-slate-800 p-5">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search executives..."
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-500"
        />
      </div>
    </div>

    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-950 text-slate-400">
        <tr>
          <th className="px-6 py-4">User</th>
          <th className="px-6 py-4">Role</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Created</th>
          <th className="px-6 py-4">Actions</th>
        </tr>
      </thead>

      <tbody>
        {filteredUsers.map((user) => (
          <tr
            key={user.id}
            className="border-t border-slate-800 transition hover:bg-slate-950/60"
          >
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold text-white">
                    {user.username}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </td>

            <td className="px-6 py-5">
              <RoleBadge role={user.role} />
            </td>

            <td className="px-6 py-5">
              <StatusBadge active={user.active} />
            </td>

            <td className="px-6 py-5 text-slate-400">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>

            <td className="px-6 py-5">
              {user.role === "EXECUTIVE" ? (
                <div className="flex flex-wrap gap-2">

                  <button
                    disabled={loadingUserId === user.id}
                    onClick={() =>
                      handleDeleteLeads(user.id, user.username)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    <Database size={15} />
<span>Delete Leads</span>
                  </button>

                  <button
                    onClick={() => {
  setSelectedUser(user);
  setEditOpen(true);
}}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                  >
                    <Pencil size={15} />
<span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
  setSelectedUser(user);
  setPasswordOpen(true);
}}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                  >
                    <KeyRound size={15} />
<span>Reset Password</span>
                  </button>

                  <button
                    onClick={() => {
  setSelectedUser(user);
  setDeleteOpen(true);
}}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950"
                  >
                    <Trash2 size={15} />
<span>Delete User</span>
                  </button>

                </div>
              ) : (
                <span className="text-slate-500">
                  Administrator
                </span>
              )}
            </td>
          </tr>
        ))}

        {filteredUsers.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="py-10 text-center text-slate-500"
            >
              No users found.
            </td>
          </tr>
        )}
      </tbody>
        </table>

    <EditUserModal
      open={editOpen}
      user={selectedUser}
      onClose={() => {
        setEditOpen(false);
        setSelectedUser(null);
      }}
      onSave={async ({ username, email, active }) => {
        if (!selectedUser) return;

        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            active,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message);
          return;
        }

        toast.success("Executive updated");

setEditOpen(false);
setSelectedUser(null);
location.reload();
      }}
    />

    <PasswordModal
      open={passwordOpen}
      onClose={() => {
        setPasswordOpen(false);
        setSelectedUser(null);
      }}
      onSave={async (password) => {
        if (!selectedUser) return;

        const res = await fetch(
          `/api/admin/users/${selectedUser.id}/password`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              password,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message);
          return;
        }

        toast.success("Password updated");

setPasswordOpen(false);
setSelectedUser(null);
      }}
    />

    <DeleteUserModal
      open={deleteOpen}
      username={selectedUser?.username ?? ""}
      onClose={() => {
        setDeleteOpen(false);
        setSelectedUser(null);
      }}
      onDelete={async () => {
        if (!selectedUser) return;

        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message);
          return;
        }

        toast.success("Executive deleted");

setDeleteOpen(false);
setSelectedUser(null);
location.reload();;
      }}
    />
  </div>
);
}