"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import LiveCall from "@/components/executive/LiveCall";
import { getMarkInStatus } from "@/lib/attendance";

type ExecutiveUser = { id: string };
type IncomingCall = { lead?: { name?: string; mobile?: string } } | null;

export default function StartShift() {
  const [user, setUser] = useState<ExecutiveUser | null>(null);
  const [attendance, setAttendance] = useState("OFFLINE");
  const [notice, setNotice] = useState("");
  const [incoming, setIncoming] = useState<IncomingCall>(null);
  const [showLive, setShowLive] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
    })();
  }, []);

  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  const setPresence = useCallback(async (s: string, silent = false) => {
    if (!user) return;
    const desired = s === "PRESENT" ? getMarkInStatus() || "PRESENT" : s;
    try {
      const res = await fetch("/api/executive/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: desired }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setNotice(body?.error || "Unable to update attendance.");
        return;
      }
      const data = await res.json();
      const nextStatus = data.state?.status || desired;
      setAttendance(nextStatus);
      if (nextStatus === "PRESENT" || nextStatus === "LATE") {
        setSessionStartedAt(Date.now());
      }
      if (nextStatus === "OFFLINE") {
        setSessionStartedAt(null);
      }
      if (!silent) {
        setNotice(`Attendance marked ${nextStatus.replaceAll("_", " ").toLowerCase()}.`);
      }
    } catch {
      setNotice("Unable to update attendance.");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadStatus = async () => {
      const res = await fetch(`/api/executive/presence?userId=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const currentStatus = data.state?.status || "OFFLINE";
      setAttendance(currentStatus);
      if (currentStatus === "PRESENT" || currentStatus === "LATE") {
        setSessionStartedAt(Date.now());
      }

      if (currentStatus === "OFFLINE") {
        const autoStatus = getMarkInStatus();
        if (autoStatus) {
          setTimeout(() => void setPresence(autoStatus, true), 0);
        } else {
          setNotice("Outside India office hours. Your attendance will sync when you start your shift.");
        }
      }
    };

    loadStatus();

    const es = new EventSource(`/api/executive/events?userId=${user.id}`);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type === "incoming_call") setIncoming(parsed.payload || parsed);
      } catch (e) {}
    };
    esRef.current = es;
    return () => {
      es.close();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      if (attendance !== "OFFLINE") {
        fetch("/api/executive/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, status: attendance }),
          keepalive: true,
        });
      }
    }, 1000 * 60 * 3);
    return () => window.clearInterval(interval);
  }, [attendance, user]);

  useEffect(() => {
    if (!user) return;
    const handleUnload = () => {
      let nextStatus = "OFFLINE";
      if (attendance === "PRESENT" && sessionStartedAt) {
        const elapsed = Date.now() - sessionStartedAt;
        if (elapsed < 1000 * 60 * 60 * 4) {
          nextStatus = "HALF_DAY";
        }
      }
      const payload = JSON.stringify({ userId: user.id, status: nextStatus });
      navigator.sendBeacon("/api/executive/presence", payload);
    };

    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [attendance, sessionStartedAt, user]);


  const togglePresence = () => {
    const next = attendance === "PRESENT" || attendance === "LATE" ? "OFFLINE" : getMarkInStatus() || "PRESENT";
    void setPresence(next);
  };

  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-slate-950/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Attendance control</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Mark your day</h2>
          <p className="mt-1 text-sm text-slate-400">Your attendance status is synced live to HR.</p>
        </div>
        <button onClick={togglePresence} className={`rounded-xl px-4 py-2 text-sm font-semibold ${attendance === "PRESENT" ? "bg-rose-500 text-white" : "bg-emerald-500 text-slate-950"}`}>
          {attendance === "PRESENT" ? "Mark absent" : "Mark present"}
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.08] bg-slate-900/80 p-4">
        <p className="text-sm text-slate-400">Your mark-in time is captured automatically based on India office hours (10:00–18:30). Late entries after 10:15 are synced directly to HR.</p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.08] bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[.16em] text-slate-500">Current attendance</p>
            <p className="mt-1 text-lg font-semibold text-white">{attendance.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-[11px] uppercase tracking-[.15em] text-slate-400">Live</div>
        </div>
        {notice ? <p className="mt-3 text-sm text-cyan-300">{notice}</p> : <p className="mt-3 text-sm text-slate-400">Choose a status or press the quick toggle to update HR attendance instantly.</p>}
      </div>

      {incoming ? (
        <div className="mt-4 rounded-3xl border border-white/[0.08] bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-white">Incoming call</p>
          <p className="mt-2 text-sm text-slate-400">{incoming.lead?.name} · {incoming.lead?.mobile}</p>
        </div>
      ) : null}

      {showLive && attendance === "PRESENT" ? (
        <div className="mt-4">
          <LiveCall />
        </div>
      ) : null}
    </section>
  );
}
