"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
};

export default function PasswordModal({
  open,
  onClose,
  onSave,
}: Props) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password.trim()) return;

    setSaving(true);

    await onSave(password);

    setSaving(false);
    setPassword("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        <h2 className="text-2xl font-bold text-white">
          Reset Password
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Enter a new password for this executive.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-5 py-3 text-white hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}