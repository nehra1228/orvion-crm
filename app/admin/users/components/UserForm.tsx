"use client"

import { useState } from "react";

export default function UserForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username || !password) {
      setStatus("Username and password are required.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch (err) {
        console.warn("Failed to parse JSON response", err);
      }

      if (!response.ok) {
        const msg = result?.message || `Failed to create user (status ${response.status})`;
        console.error("Create user failed:", msg, result);
        setStatus(msg);
      } else {
        console.info("User created", result);
        setStatus("User created successfully.");
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("EXECUTIVE");
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Network error creating user", err);
      setStatus("Network error: could not create user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold text-white">Create Executive</h3>

      <div>
        <label className="text-sm text-slate-400">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
      </div>

      <div>
        <label className="text-sm text-slate-400">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
      </div>

      <div>
        <label className="text-sm text-slate-400">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none" />
      </div>

      <div>
        <label className="text-sm text-slate-400">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none">
          <option value="EXECUTIVE">Executive</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50">
        {submitting ? "Saving…" : "Create Executive"}
      </button>

      {status ? <p aria-live="polite" className="text-sm text-slate-300">{status}</p> : null}
    </form>
  );
}
