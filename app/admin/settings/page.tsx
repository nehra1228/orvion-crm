"use client"

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadLogo() {
      const response = await fetch("/api/admin/logo");
      const data = await response.json();
      setLogoUrl(data.logoUrl ?? null);
    }
    loadLogo();

    async function loadAccount() {
      try {
        const res = await fetch("/api/admin/account");
        if (res.ok) {
          const data = await res.json();
          setAccountUsername(data.username || "");
        }
      } catch (e) {
        // ignore
      }
    }
    loadAccount();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("logo") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setStatus("Please choose a logo file.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus(result?.message || "Logo upload failed.");
      } else {
        setStatus("Logo updated successfully.");
        setFileName("");
        fileInput.value = "";
        setLogoUrl(result.logoUrl || null);
      }
    } catch (error) {
      setStatus("Logo upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setStatus(null);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Settings</p>
          <h1 className="text-4xl font-bold text-white">Company Branding</h1>
          <p className="text-slate-400 max-w-2xl">
            Upload a company logo to show across the CRM interface.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
          <form onSubmit={handleSubmit} className="grid gap-6 max-w-xl">
            {logoUrl && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Current logo</p>
                <img src={logoUrl} alt="Company logo" className="mt-3 max-h-24 object-contain" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="logo">
                Upload logo
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
              {fileName && <p className="mt-2 text-sm text-slate-400">Selected file: {fileName}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uploading…" : "Upload Logo"}
            </button>

            {status && <p className="text-sm text-slate-300">{status}</p>}
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
          <h2 className="text-2xl font-semibold text-white">Danger Zone</h2>
          <p className="text-slate-400">Delete all leads from the database. This action cannot be undone.</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!window.confirm("Are you sure you want to delete all leads? This cannot be undone.")) return;
                setDeleting(true);
                setDeleteStatus(null);

                try {
                  const res = await fetch("/api/admin/leads", { method: "DELETE" });
                  const json = await res.json();
                  if (!res.ok) {
                    setDeleteStatus(json?.message || "Failed to delete leads.");
                  } else {
                    setDeleteStatus(`Deleted ${json.deleted} leads.`);
                  }
                } catch (err) {
                  setDeleteStatus("Failed to delete leads.");
                } finally {
                  setDeleting(false);
                }
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete all leads"}
            </button>
            {deleteStatus && <p className="text-sm text-slate-300">{deleteStatus}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
          <h2 className="text-2xl font-semibold text-white">Admin Account</h2>
          <p className="text-slate-400">Change the admin username or password for the currently logged-in account.</p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAccountSaving(true);
              setAccountStatus(null);

              try {
                const res = await fetch("/api/admin/account", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: accountUsername, password: accountPassword }),
                });

                const json = await res.json();
                if (!res.ok) {
                  setAccountStatus(json?.message || "Failed to update account.");
                } else {
                  setAccountStatus("Account updated successfully.");
                  setAccountPassword("");
                }
              } catch (err) {
                setAccountStatus("Failed to update account.");
              } finally {
                setAccountSaving(false);
              }
            }}
            className="mt-6 grid gap-4 max-w-xl"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300">Username</label>
              <input value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">New Password</label>
              <input type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
            </div>

            <button type="submit" disabled={accountSaving} className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">
              {accountSaving ? "Saving…" : "Save Account"}
            </button>

            {accountStatus && <p className="text-sm text-slate-300">{accountStatus}</p>}
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
