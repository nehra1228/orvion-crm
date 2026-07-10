"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  username: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

export default function DeleteUserModal({
  open,
  username,
  onClose,
  onDelete,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleDelete() {
    setLoading(true);

    await onDelete();

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl border border-red-900 bg-slate-900 p-6 shadow-2xl">

        <div className="flex items-center gap-3">

          <div className="rounded-full bg-red-500/20 p-3">
            <Trash2 className="text-red-500" size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Delete Executive
            </h2>

            <p className="text-sm text-slate-400">
              This action cannot be undone.
            </p>
          </div>

        </div>

        <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4">

          <p className="text-sm text-slate-300">
            Are you sure you want to delete
          </p>

          <p className="mt-2 font-bold text-red-400">
            {username}
          </p>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 text-white hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Executive"}
          </button>

        </div>

      </div>

    </div>
  );
}