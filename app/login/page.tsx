"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    console.log("/api/auth/login response:", data);

    if (!response.ok) {
      setError(data.message || "Login failed");
      setLoading(false);
      return;
    }

    const destination = data.user?.role === "ADMIN" ? "/admin/dashboard" : "/executive/dashboard";
    console.log("Redirecting to:", destination, "user.role=", data.user?.role);
    router.push(destination);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <div className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-10">
        <div>
          <h1 className="text-5xl font-bold text-blue-500">ORVION CRM</h1>
          <p className="mt-3 text-slate-400">AI Powered Real Estate CRM</p>

          <div className="mt-16 space-y-8">
            <div>
              <h3 className="font-semibold text-xl">Lead Distribution</h3>
              <p className="text-slate-400">Automatically assign leads to executives.</p>
            </div>

            <div>
              <h3 className="font-semibold text-xl">Excel Upload</h3>
              <p className="text-slate-400">Upload thousands of leads instantly.</p>
            </div>

            <div>
              <h3 className="font-semibold text-xl">Reports</h3>
              <p className="text-slate-400">Monitor team performance in real time.</p>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm">© 2026 ORVION GROUP</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[430px] bg-slate-900 rounded-2xl p-10 shadow-2xl">
          <h2 className="text-4xl font-bold">Welcome Back</h2>
          <p className="text-slate-400 mt-2">Login to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                className="w-full p-4 rounded-lg bg-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full p-4 rounded-lg bg-slate-800 outline-none"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
