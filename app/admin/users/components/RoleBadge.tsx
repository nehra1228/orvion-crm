type Props = {
  role: string;
};

export default function RoleBadge({ role }: Props) {
  const isAdmin = role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
  const isExecutive = role === "EXECUTIVE";

  const badgeLabel = isAdmin ? "ADMIN" : isExecutive ? "EXECUTIVE" : role;
  const badgeClassName = isAdmin
    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
    : isExecutive
    ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
    : "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${badgeClassName}`}>
      {badgeLabel}
    </span>
  );
}
