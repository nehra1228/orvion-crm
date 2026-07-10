import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: FeatureCardProps) {
  return (
    <div
      className="
        group
        rounded-3xl
        border
        border-white/10
        bg-white/[0.04]
        p-6
        backdrop-blur-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-400/30
        hover:bg-white/[0.06]
        hover:shadow-2xl
        hover:shadow-cyan-500/10
      "
    >
      <div className="flex items-center gap-5">

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={26} />
        </div>

        <div>

          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>

        </div>

      </div>
    </div>
  );
}