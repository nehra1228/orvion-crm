"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  role: string;
  active: boolean;
};

type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: {
    username: string;
    email: string;
    active: boolean;
  }) => Promise<void>;
};

export default function EditUserModal({
  open,
  user,
  onClose,
  onSave,
}: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail("");
      setActive(user.active);
    }
  }, [user]);

  if (!open || !user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    await onSave({
      username,
      email,
      active,
    });

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        <h2 className="text-2xl font-bold text-white">
          Edit Executive
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Update executive information.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Username
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Status
            </label>

            <select
              value={active ? "true" : "false"}
              onChange={(e) =>
                setActive(e.target.value === "true")
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            >
              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-5 py-3 text-white transition hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}