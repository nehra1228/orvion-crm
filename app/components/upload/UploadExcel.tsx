"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

export default function UploadExcel() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert(
  `Import Completed

Imported: ${data.imported}

Duplicates: ${data.duplicates}

Executives: ${data.assignedExecutives}`
);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-cyan-500/40 bg-[#101828] p-8 text-center">

      <UploadCloud
        className="mx-auto mb-4 text-cyan-400"
        size={60}
      />

      <h2 className="text-xl font-semibold text-white">
        Upload Excel Leads
      </h2>

      <p className="mt-2 text-slate-400">
        Upload .xlsx or .xls files
      </p>

      <button
        onClick={() => inputRef.current?.click()}
        className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        {uploading ? "Uploading..." : "Choose Excel"}
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          if (e.target.files?.length) {
            uploadFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}