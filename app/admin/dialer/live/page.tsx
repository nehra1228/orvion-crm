"use client";
import { useEffect, useState } from "react";

export default function DialerLiveAdmin() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchCalls = async () => {
      try {
        const res = await fetch('/api/dialer/active');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setCalls(data.calls || []);
      } catch (e) {
        // ignore
      }
    };
    fetchCalls();
    const id = setInterval(fetchCalls, 3000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const action = async (callId: string, act: string) => {
    await fetch('/api/dialer/supervisor-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId, action: act }) });
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Live Calls</h1>
      <div className="mt-4 space-y-3">
        {calls.length === 0 ? <div className="text-slate-400">No active calls</div> : calls.map(c => (
          <div key={c.id} className="rounded p-3 bg-slate-800 text-white flex items-center justify-between">
            <div>
              <div className="font-semibold">{c.lead?.name} — {c.lead?.mobile}</div>
              <div className="text-sm text-slate-400">Exec: {c.executive?.username || c.executiveId} Campaign: {c.campaign?.name || '-'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => action(c.id, 'listen')} className="rounded bg-slate-700 px-3 py-1">Listen</button>
              <button onClick={() => action(c.id, 'whisper')} className="rounded bg-slate-700 px-3 py-1">Whisper</button>
              <button onClick={() => action(c.id, 'barge')} className="rounded bg-rose-600 px-3 py-1 text-white">Barge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
