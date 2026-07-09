"use client"

import { useEffect, useState } from "react";
import { Bell, Search, UserCircle } from "lucide-react";

export default function Navbar({ user: initialUser }: { user?: { id: string; username: string; role?: string } | null }) {
  const [user, setUser] = useState<any>(initialUser ?? null);

  useEffect(() => {
    if (user) return;
    fetch("/api/admin/account")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {});
  }, [user]);

  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">

      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>

        <p className="text-slate-400 text-sm">Welcome back, {user?.username ?? "Admin"}</p>
      </div>

      <div className="flex items-center gap-5">

        <div className="relative">
          <Search size={18} className="absolute left-4 top-4 text-slate-500" />

          <input
            placeholder="Search..."
            className="bg-slate-800 rounded-xl h-12 w-80 pl-11 pr-4 text-white outline-none"
          />

        </div>

        <Bell className="text-white cursor-pointer" size={22} />

        <div className="flex items-center gap-3">

          <UserCircle size={40} className="text-blue-500" />

          <div>
            <h4 className="text-white font-semibold">{user?.username ?? "Admin"}</h4>
            <p className="text-slate-400 text-sm">{user?.role ?? "ORVION GROUP"}</p>
          </div>

        </div>

      </div>

    </header>
  );
}