"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  Tooltip,
} from "recharts";

interface MonthlyData {
  month: string;
  leads: number;
}

export default function MonthlyLeadsChart() {
  const [data, setData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/dashboard/monthly", {
        cache: "no-store",
      });

      const json = await res.json();
      setData(json);
    }

    loadData();
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0C101D] p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        Monthly Leads
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1F2937" />

            <XAxis
              dataKey="month"
              stroke="#94A3B8"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="leads"
              stroke="#06B6D4"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}