"use client";

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
        alert(data.message);
      } else {
        alert(`Deleted ${data.deleted} leads`);
        location.reload();
      }
    } finally {
      setLoadingUserId(null);
    }
  }

  async function editUser(user: UserRow) {
    const username = prompt("Username", user.username);
    if (!username) return;

    const email = prompt("Email", "");

    const active = confirm("Should this user remain active?");

    const res = await fetch(`/api/admin/users/${user.id}`, {
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
      alert(data.message);
      return;
    }

    alert("User updated");
    location.reload();
  }

  async function changePassword(user: UserRow) {
    const password = prompt("New Password");

    if (!password) return;

    const res = await fetch(`/api/admin/users/${user.id}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Password updated");
  }

  async function deleteUser(user: UserRow) {
    if (
      !confirm(
        `Delete executive "${user.username}"?\n\nDelete Leads first if required.`
      )
    )
      return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Executive deleted");

    location.reload();
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
            <tr
              key={user.id}
              className="border-t border-slate-800 hover:bg-slate-950"
            >
              <td className="px-4 py-4 text-white">{user.username}</td>

              <td className="px-4 py-4">{user.role}</td>

              <td className="px-4 py-4">
                {user.active ? "Yes" : "No"}
              </td>

              <td className="px-4 py-4">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>

              <td className="px-4 py-4">
                {user.role === "EXECUTIVE" ? (
                  <div className="flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        handleDeleteLeads(user.id, user.username)
                      }
                      className="rounded bg-red-600 px-2 py-1 text-white"
                    >
                      Delete Leads
                    </button>

                    <button
                      onClick={() => editUser(user)}
                      className="rounded bg-blue-600 px-2 py-1 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => changePassword(user)}
                      className="rounded bg-purple-600 px-2 py-1 text-white"
                    >
                      Password
                    </button>

                    <button
                      onClick={() => deleteUser(user)}
                      className="rounded bg-red-900 px-2 py-1 text-white"
                    >
                      Delete
                    </button>

                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}