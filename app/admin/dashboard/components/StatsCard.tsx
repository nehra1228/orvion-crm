"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  CalendarDays,
  UserCheck,
  PhoneCall,
  MapPin,
  BadgeCheck,
  CircleX,
} from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  todaysLeads: number;
  monthlyLeads: number;
  booked: number;
  lost: number;
  followUps: number;
  siteVisits: number;
  executives: number;
}

export default function StatsCard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
if (!stats) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-3xl bg-[#0C101D]"
        />
      ))}
    </div>
  );
}
  useEffect(() => {
  async function fetchStats() {
    try {
      const res = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  fetchStats();

  const interval = setInterval(fetchStats, 5000);

  return () => clearInterval(interval);
}, []);
  const cards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: Users,
    },
    {
      title: "Today's Leads",
      value: stats?.todaysLeads ?? 0,
      icon: UserPlus,
    },
    {
      title: "Monthly Leads",
      value: stats?.monthlyLeads ?? 0,
      icon: CalendarDays,
    },
    {
      title: "Executives",
      value: stats?.executives ?? 0,
      icon: UserCheck,
    },
    {
      title: "Follow Ups",
      value: stats?.followUps ?? 0,
      icon: PhoneCall,
    },
    {
      title: "Site Visits",
      value: stats?.siteVisits ?? 0,
      icon: MapPin,
    },
    {
      title: "Booked",
      value: stats?.booked ?? 0,
      icon: BadgeCheck,
    },
    {
      title: "Lost",
      value: stats?.lost ?? 0,
      icon: CircleX,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-3xl border border-white/10 bg-[#0C101D] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
  {card.title}
</p>

<h2 className="mt-3 text-4xl font-bold text-white">
  {card.value}
</h2>

<p className="mt-2 text-xs text-emerald-400">
  Live Data
</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-4 border border-cyan-500/20">
  <Icon
    className="text-cyan-400"
    size={28}
  />
</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}