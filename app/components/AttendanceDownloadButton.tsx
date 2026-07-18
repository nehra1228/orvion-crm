"use client";

import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";

export default function AttendanceDownloadButton() {
  const pathname = usePathname();

  if (!pathname) return null;

  // Only show on the HR admin attendance page
  if (!pathname.startsWith("/admin/hr")) return null;

  const download = async () => {
    const from = window.prompt("From date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!from) return;
    const to = window.prompt("To date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!to) return;
    try {
      const res = await fetch(`/api/hr/attendance?from=${from}&to=${to}&format=csv`);
      if (!res.ok) throw new Error("Failed to download attendance");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${from}-${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // small toast via window alert as lightweight feedback
      alert(`Downloaded attendance ${from} → ${to}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to download attendance");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button onClick={download} className="rounded-full bg-cyan-400/10 p-3 text-cyan-300 shadow-lg hover:bg-cyan-400/20">
        <FileText className="h-5 w-5" />
      </button>
    </div>
  );
}
