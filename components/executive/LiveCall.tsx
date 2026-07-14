"use client";
import React, { useEffect, useRef, useState } from "react";

type CallState = {
  id: string;
  status: string;
  lead?: { id: string; name?: string; mobile?: string } | null;
  startedAt?: string | null;
  muted?: boolean;
  onHold?: boolean;
};

export default function LiveCall() {
  const [call, setCall] = useState<CallState | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/executive/events");

    const onMessage = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload?.type === "incoming_call") {
          setCall(payload.payload);
        } else if (payload?.type === "call_update") {
          const updated = payload.payload;
          setCall((c) => (c?.id === updated.id ? { ...(c || {}), ...updated } : c));
        }
      } catch (err) {
        // ignore
      }
    };

    es.addEventListener("message", onMessage);
    es.addEventListener("incoming_call", onMessage as EventListener);
    es.addEventListener("call_update", onMessage as EventListener);

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (call?.status === "CONNECTED" && call.startedAt) {
      const start = new Date(call.startedAt).getTime();
      const update = () => setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      update();
      timerRef.current = window.setInterval(update, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSeconds(0);
    }
  }, [call?.status, call?.startedAt]);

  if (!call) return null;

  const postAction = async (action: string, extra?: Record<string, any>) => {
    await fetch("/api/dialer/call-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, callId: call.id, ...extra }),
    });
  };

  const formatTime = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">Active Call</div>
          <div className="text-lg font-semibold text-white">{call.lead?.name ?? "Unknown"}</div>
          <div className="text-sm text-slate-400">{call.lead?.mobile ?? "-"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Status</div>
          <div className="text-sm font-medium text-white">{call.status}</div>
          <div className="text-sm text-emerald-400">{formatTime(seconds)}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={() => postAction(call.muted ? "unmute" : "mute")}
        >
          {call.muted ? "Unmute" : "Mute"}
        </button>

        <button
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={() => postAction(call.onHold ? "resume" : "hold")}
        >
          {call.onHold ? "Resume" : "Hold"}
        </button>

        <button
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={async () => {
            const target = window.prompt("Transfer to number (E.164):");
            if (!target) return;
            await postAction("transfer", { target });
          }}
        >
          Transfer
        </button>

        <div className="ml-auto flex gap-2">
          <button
            className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
            onClick={() => postAction("end")}
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
