import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditLeadForm from "../../../components/leads/EditLeadForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#05070F] p-10 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-5 py-3 transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Back to Leads
          </Link>
        </div>

        <EditLeadForm lead={lead} />

      </div>
    </div>
  );
}