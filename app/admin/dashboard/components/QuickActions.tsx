"use client";

import Link from "next/link";
import {
  UserPlus,
  Upload,
  Users,
  FilePlus,
} from "lucide-react";

const actions = [
  {
    title: "Upload Leads",
    href: "/admin/upload",
    icon: Upload,
  },
  {
    title: "Manage Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "View Leads",
    href: "/admin/leads",
    icon: FilePlus,
  },
  {
    title: "Create Executive",
    href: "/admin/users",
    icon: UserPlus,
  },
];

export default function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500 hover:bg-slate-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white">
              <Icon size={24} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {action.title}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Open {action.title.toLowerCase()}
            </p>
          </Link>
        );
      })}
    </div>
  );
}