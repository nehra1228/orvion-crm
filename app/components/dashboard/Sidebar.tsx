"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Upload,
  Phone,
  BarChart3,
  Settings,
  LogOut,
  User,
} from "lucide-react";



const menu = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Leads",
    href: "/admin/leads",
    icon: Users,
  },
  {
    name: "Upload Leads",
    href: "/admin/upload",
    icon: Upload,
  },
  {
    name: "Calling",
    href: "/admin/calling",
    icon: Phone,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },

{
  name: "Executives",
  href: "/admin/executives",
  icon: User,
},

];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[280px] flex-col border-r border-white/10 bg-[#05070F]">

      {/* Logo */}

      <div className="border-b border-white/10 p-8">

        <h1 className="text-4xl font-black tracking-wide text-white">
          ORVION
        </h1>

        <p className="mt-2 text-slate-400">
          Enterprise CRM
        </p>

      </div>

      {/* Menu */}

      <nav className="flex-1 space-y-2 p-5">

        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 ${
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={22} />

              <span className="font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}

      </nav>

      {/* Footer */}

      <div className="border-t border-white/10 p-5">

        <button className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">

          <LogOut size={20} />

          Logout

        </button>

      </div>

    </aside>
  );
}