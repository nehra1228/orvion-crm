"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Upload,
  Phone,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Executives",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Upload Leads",
    icon: Upload,
    href: "/admin/upload",
  },
  {
    title: "Calling Data",
    icon: Phone,
    href: "/admin/leads",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/admin/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadLogo() {
      try {
        const response = await fetch("/api/admin/logo");
        const data = await response.json();
        setLogoUrl(data.logoUrl || null);
      } catch {
        setLogoUrl(null);
      }
    }
    loadLogo();
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/admin/account");
        const data = await res.json();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    const ok = window.confirm("Are you sure you want to logout?");
    if (!ok) return;

    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-start justify-between">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="h-14 w-auto rounded-xl object-contain" />
          ) : (
            <h1 className="text-3xl font-bold text-blue-500">ORVION CRM</h1>
          )}

          <p className="text-slate-400 text-sm mt-2">
            {user && String(user.role).toLowerCase() === "executive" ? "Executive Panel" : "Admin Panel"}
          </p>
        </div>

        {/** show a small logout button near the top for quicker access */}
        <div className="ml-3">
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-400 p-2 rounded-md hover:bg-slate-800"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-5 space-y-2">
        {loadingUser ? (
          // simple loading skeleton while user is fetched
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-800 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          // If the user is an executive, do not render any navigation links.
          // The logout button remains at the bottom as the only action.
          (user && String(user.role).toLowerCase() === "executive") ? null : (
            menu
              .filter((item) => {
                // Hide certain admin-only items when appropriate
                const execOnly = ["/admin/upload", "/admin/leads", "/admin/reports"];

                if (item.href === "/admin/users") {
                  // only admins should see the Executives/users page
                  return user && String(user.role).toLowerCase() === "admin";
                }

                if (user && String(user.role).toLowerCase() === "executive") {
                  return !execOnly.includes(item.href);
                }

                return true;
              })
              .map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition"
                  >
                    <Icon size={20} />

                    {item.title}
                  </Link>
                );
              })
          )
        )}
      </nav>

      <div className="p-5 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}