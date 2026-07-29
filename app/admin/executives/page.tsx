"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

type Executive = {
  id: string;
  username: string;
  fullName?: string | null;
  role?: string | null;
};

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadExecutives = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || "Failed to load executives");
        }
        const data = await res.json();
        const allUsers = Array.isArray(data) ? data as Executive[] : Array.isArray(data?.data) ? data.data as Executive[] : [];
        setExecutives(allUsers.filter((user) => user.role === "EXECUTIVE"));
      } catch (error) {
        console.error(error);
        setExecutives([]);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    loadExecutives();
  }, []);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h1 className="text-2xl font-bold text-white">Executive workspace</h1>
          <p className="mt-2 text-sm text-slate-400">Click an executive to open their lead workspace.</p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Loading executives…</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-300">Unable to load executives: {error}</p>
          ) : executives.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">No executives found.</p>
          ) : (
            <div className="mt-6 grid gap-3">
              {executives.map((user) => (
                <div key={user.id} className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.location.assign(`/admin/executives/${user.id}`)}
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-left text-lg font-semibold text-white transition hover:border-cyan-300/40 hover:bg-slate-900"
                  >
                    {user.fullName || user.username}
                  </button>
                  <button
                    type="button"
                    disabled={deleting === user.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Delete executive ${user.username}? This cannot be undone.`)) return;
                      try {
                        setDeleting(user.id);
                        const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE", credentials: "include" });
                        if (!res.ok) throw new Error("Delete failed");
                        setExecutives((prev) => prev.filter((u) => u.id !== user.id));
                      } catch (err) {
                        console.error(err);
                        alert("Failed to delete executive");
                      } finally {
                        setDeleting(null);
                      }
                    }}
                    className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    aria-label={`Delete ${user.username}`}
                  >
                    {deleting === user.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
