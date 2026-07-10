type Props = {
  role: string;
};

export default function RoleBadge({ role }: Props) {
  const isAdmin = role === "ADMIN";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold border ${
        isAdmin
          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
          : "bg-sky-500/20 text-sky-400 border-sky-500/30"
      }`}
    >
      {isAdmin ? "ADMIN" : "EXECUTIVE"}
    </span>
  );
}