import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardCard {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ size?: number }>; 
  iconClass?: string;
}

export default function DashboardCards({
  cards,
}: {
  cards: DashboardCard[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
                  {card.title}
                </p>
                <p className="mt-4 text-4xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-sm text-slate-400">{card.description}</p>
              </div>
              <div className={cn("inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950/80", card.iconClass)}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
