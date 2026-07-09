"use client"

import { useState } from "react";

type UserRow = {
  id: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
};

export default function UserTable({ users }: { users: UserRow[] }) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  async function handleDeleteLeads(userId: string, username: string) {
    if (!window.confirm(`Delete all leads assigned to ${username}?`)) return;
    setLoadingUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}/leads`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data?.message || "Failed to delete leads.");
      } else {
        alert(`Deleted ${data.deleted} leads for ${username}.`);
        window.location.reload();
      }
    } catch (error) {
      alert("Failed to delete leads.");
    } finally {
      setLoadingUserId(null);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-950 text-slate-400">
          <tr>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-950">
              <td className="px-4 py-4 text-white">{user.username}</td>
              <td className="px-4 py-4 text-slate-300">{user.role}</td>
              <td className="px-4 py-4 text-slate-300">{user.active ? "Yes" : "No"}</td>
              <td className="px-4 py-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-4">
                {user.role === "EXECUTIVE" ? (
                  <button
                    type="button"
                    disabled={loadingUserId === user.id}
                    onClick={() => handleDeleteLeads(user.id, user.username)}
                    className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingUserId === user.id ? "Deleting…" : "Delete leads"}
                  </button>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
