"use client";

import { useEffect, useState } from "react";

interface Executive {
  id: string;
  name: string;
  total: number;
  interested: number;
  followUps: number;
  booked: number;
}

export default function ExecutiveLeaderboard() {
  const [executives, setExecutives] = useState<Executive[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/leaderboard", {
        cache: "no-store",
      });

      const data = await res.json();
      setExecutives(data);
    }

    load();
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        Executive Leaderboard
      </h2>

      <div className="space-y-4">
        {executives.map((user, index) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#121827] p-4"
          >
            <div>
              <p className="font-semibold text-white">
                #{index + 1} {user.name}
              </p>

              <p className="text-sm text-slate-400">
                Assigned Leads: {user.total}
              </p>
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-cyan-400 font-bold">
                  {user.interested}
                </p>
                <p className="text-xs text-slate-500">
                  Interested
                </p>
              </div>

              <div>
                <p className="text-yellow-400 font-bold">
                  {user.followUps}
                </p>
                <p className="text-xs text-slate-500">
                  Follow-up
                </p>
              </div>

              <div>
                <p className="text-green-400 font-bold">
                  {user.booked}
                </p>
                <p className="text-xs text-slate-500">
                  Booked
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}