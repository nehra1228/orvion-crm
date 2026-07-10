type Lead = {
  id: string;
  name: string;
  mobile: string;
  status: string;
  assignedTo?: {
    username: string;
  } | null;
};

export default function RecentActivity({
  recentLeads,
}: {
  recentLeads: Lead[];
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Recent Leads
          </h2>

          <p className="text-sm text-slate-400">
            Latest activity in your CRM
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {recentLeads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 transition hover:bg-slate-800"
          >
            <div>
              <p className="font-semibold text-white">
                {lead.name}
              </p>

              <p className="text-sm text-slate-400">
                {lead.mobile}
              </p>
            </div>

            <div className="text-right">
              <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-400">
                {lead.status}
              </span>

              <p className="mt-2 text-xs text-slate-500">
                {lead.assignedTo?.username ?? "Unassigned"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}