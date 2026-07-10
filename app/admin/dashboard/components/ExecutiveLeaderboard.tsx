"use client";

import { Trophy, Medal, Award } from "lucide-react";

const executives = [
  {
    name: "Rahul",
    leads: 42,
    color: "text-yellow-400",
    icon: Trophy,
  },
  {
    name: "Aman",
    leads: 37,
    color: "text-slate-300",
    icon: Medal,
  },
  {
    name: "Priya",
    leads: 29,
    color: "text-amber-600",
    icon: Award,
  },
];

export default function ExecutiveLeaderboard() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="text-xl font-semibold text-white">
        Top Executives
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Weekly performance
      </p>

      <div className="mt-6 space-y-4">

        {executives.map((user) => {
          const Icon = user.icon;

          return (
            <div
              key={user.name}
              className="flex items-center justify-between rounded-2xl bg-slate-950 p-4"
            >
              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-slate-800 p-3">
                  <Icon
                    className={user.color}
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-white">
                    {user.name}
                  </p>

                  <p className="text-sm text-slate-400">
                    Executive
                  </p>
                </div>

              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  {user.leads}
                </p>

                <p className="text-xs text-slate-500">
                  Leads
                </p>
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}