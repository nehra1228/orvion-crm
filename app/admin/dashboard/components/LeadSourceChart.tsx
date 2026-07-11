"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#06B6D4",
  "#EF4444",
  "#FACC15",
];

interface SourceData {
  name: string;
  value: number;
}

export default function LeadSourceChart() {
  const [data, setData] = useState<SourceData[]>([]);

  useEffect(() => {
    async function loadSources() {
      try {
        const res = await fetch("/api/dashboard/sources", {
          cache: "no-store",
        });

        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      }
    }

    loadSources();

    const interval = setInterval(loadSources, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">
        Lead Sources
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Distribution of incoming leads
      </p>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={55}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}