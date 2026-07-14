"use client";
import { useEffect, useState } from "react";

export default function DialerAdmin() {
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/dialer/config").then(r => r.json()).then(data => { if (data?.provider) { setProvider(data.provider); setConfigJson(JSON.stringify(data.config || {}, null, 2)); } });
  }, []);

  async function save() {
    setMessage("Saving...");
    const cfg = configJson ? JSON.parse(configJson) : undefined;
    const res = await fetch("/api/dialer/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey, config: cfg }) });
    const data = await res.json();
    if (data?.success) setMessage("Saved"); else setMessage(data?.error || "Error");
  }

  return (<div className="p-6"><h1 className="text-lg font-bold">Dialer Settings</h1>
    <div className="mt-4 space-y-3 max-w-xl">
      <label className="block"><div className="text-sm text-slate-400">Provider</div><select value={provider} onChange={(e)=>setProvider(e.target.value)} className="mt-1 w-full rounded border p-2"><option value="">-- select --</option><option value="twilio">Twilio</option><option value="exotel">Exotel</option><option value="knowlarity">Knowlarity</option></select></label>
      <label className="block"><div className="text-sm text-slate-400">API Key / Secret</div><input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Leave blank to use simulator" /></label>
      <label className="block"><div className="text-sm text-slate-400">Provider config (JSON)</div><textarea value={configJson} onChange={(e)=>setConfigJson(e.target.value)} className="mt-1 w-full rounded border p-2 h-36" placeholder='{"accountSid":"AC...","authToken":"...","from":"+1..."}' /></label>
      <div><button onClick={save} className="rounded bg-cyan-500 px-4 py-2 text-white">Save</button><span className="ml-3 text-sm text-slate-400">{message}</span></div>
    </div>
    <div className="mt-6 border-t border-slate-800 pt-6 max-w-xl">
      <h2 className="text-sm font-semibold text-white">Manual Enqueue</h2>
      <p className="text-sm text-slate-400">Quickly enqueue a lead to the dialer queue.</p>
      <div className="mt-3 space-y-2">
        <input placeholder="Lead ID" id="leadId" className="w-full rounded border p-2 bg-slate-900 text-white" />
        <input placeholder="Campaign ID (optional)" id="campaignId" className="w-full rounded border p-2 bg-slate-900 text-white" />
        <input placeholder="Priority (0)" id="priority" className="w-full rounded border p-2 bg-slate-900 text-white" />
        <div>
          <button onClick={async () => {
            const leadId = (document.getElementById('leadId') as HTMLInputElement).value;
            const campaignId = (document.getElementById('campaignId') as HTMLInputElement).value || null;
            const priorityRaw = (document.getElementById('priority') as HTMLInputElement).value || '0';
            const priority = Number(priorityRaw) || 0;
            if (!leadId) { setMessage('enter lead id'); return; }
            setMessage('Enqueuing...');
            const res = await fetch('/api/dialer/enqueue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, campaignId, priority }) });
            const d = await res.json();
            if (d?.success) setMessage('Enqueued'); else setMessage(d?.error || 'Error');
          }} className="rounded bg-emerald-600 px-3 py-2 text-white">Enqueue</button>
          <a href="/admin/dialer/live" className="ml-3 text-sm text-slate-400">Open Live Calls</a>
        </div>
      </div>
    </div>
  </div>);
}
