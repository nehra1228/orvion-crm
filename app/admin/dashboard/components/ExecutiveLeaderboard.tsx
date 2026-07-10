"use client";

import { Trophy, Medal, Award } from "lucide-react";

type Executive = {
  id: string;
  username: string;
  _count: {
  leads: number;
};
};

type Props = {
  executives: Executive[];
};

export default function ExecutiveLeaderboard({
  executives,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">
        Top Executives
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Ranked by assigned leads
      </p>

      <div className="mt-6 space-y-4">
        {executives.map((user, index) => {
          const Icon =
            index === 0
              ? Trophy
              : index === 1
              ? Medal
              : Award;

          const color =
            index === 0
              ? "text-yellow-400"
              : index === 1
              ? "text-slate-300"
              : "text-amber-600";

          return (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 transition hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-800 p-3">
                  <Icon
                    className={color}
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-white">
                    {user.username}
                  </p>

                  <p className="text-sm text-slate-400">
                    Executive
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  {user._count.leads}
                </p>

                <p className="text-xs text-slate-500">
                  Assigned Leads
                </p>
              </div>
            </div>
          );
        })}

        {executives.length === 0 && (
          <p className="py-8 text-center text-slate-500">
            No executives found.
          </p>
        )}
      </div>
    </div>
  );
}