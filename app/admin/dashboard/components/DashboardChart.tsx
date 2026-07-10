"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

const data = [
  { day: "Mon", leads: 18 },
  { day: "Tue", leads: 27 },
  { day: "Wed", leads: 21 },
  { day: "Thu", leads: 34 },
  { day: "Fri", leads: 29 },
  { day: "Sat", leads: 42 },
  { day: "Sun", leads: 31 },
];

export default function DashboardChart() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">
        Lead Activity
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Last 7 days
      </p>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="#1e293b" />

            <XAxis
              dataKey="day"
              stroke="#94a3b8"
            />

            <Tooltip />

            <Area
              dataKey="leads"
              stroke="#3b82f6"
              fill="#2563eb55"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}