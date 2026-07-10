type Props = {
  active: boolean;
};

export default function StatusBadge({ active }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}
    >
      <span
        className={`mr-2 h-2 w-2 rounded-full ${
          active ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}