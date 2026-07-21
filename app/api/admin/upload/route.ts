import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadRemark, LeadStatus } from "@prisma/client";
import * as XLSX from "xlsx";

const queueSource: Record<string, string> = { TODAY_LEADS: "Leads", CALLING_DATA: "Calling data", AUTOCALLER: "Autocaller data" };
const asText = (value: unknown) => String(value ?? "").trim();
const mobile = (value: string) => { const digits = value.replace(/\D/g, ""); if (digits.length === 10) return digits; if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2); return null; };
const status = (value: string) => (["NEW", "CALLED", "INTERESTED", "FOLLOW_UP", "SITE_VISIT", "NEGOTIATION", "BOOKED", "LOST"].includes(value) ? value : "NEW") as LeadStatus;
const remark = (value: string) => (["INTERESTED", "NOT_INTERESTED", "BUSY", "SWITCH_OFF", "WRONG_NUMBER", "CALLBACK", "NO_ANSWER", "SITE_VISIT", "BOOKED", "LOST"].includes(value) ? value : null) as LeadRemark | null;

export async function POST(request: Request) {
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "No file provided." }, { status: 400 });
  try {
    const buffer = await file.arrayBuffer(); const book = XLSX.read(buffer, { type: "array" }); const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[book.SheetNames[0]], { defval: "" });
    const assignmentMode = asText(form.get("assignmentMode") || "ROUND_ROBIN").toUpperCase();
    const destinationQueue = asText(form.get("destinationQueue") || form.get("executiveQueue") || "TODAY_LEADS").toUpperCase();
    let selectedExecutive = asText(form.get("assignedToId") || form.get("executiveId")) || null;
    const selectedTeam = asText(form.get("teamId")) || null;
    const source = queueSource[destinationQueue] ?? (asText(form.get("source") || form.get("uploadSource")) || null);
    const allExecutives = await prisma.user.findMany({ where: { role: "EXECUTIVE", active: true }, orderBy: { username: "asc" }, select: { id: true, teamId: true, username: true } });
    const eligible = assignmentMode === "TEAM_ROUND_ROBIN" ? allExecutives.filter((user) => user.teamId === selectedTeam) : allExecutives;
    if (assignmentMode === "TEAM_ROUND_ROBIN" && (!selectedTeam || !eligible.length)) return NextResponse.json({ message: "The selected team has no active executives." }, { status: 400 });
    // If the client sent a username instead of an id, try to resolve it to an id
    if (selectedExecutive) {
      const foundById = allExecutives.find((u) => u.id === selectedExecutive);
      if (!foundById) {
        const foundByUsername = allExecutives.find((u) => u.username === selectedExecutive);
        if (foundByUsername) selectedExecutive = foundByUsername.id;
      }
    }

    if (assignmentMode === "EXECUTIVE" && !selectedExecutive) return NextResponse.json({ message: "Choose an executive." }, { status: 400 });

    const seen = new Set<string>();
    const leadsToCreate: Array<{
      name: string;
      mobile: string;
      project: string | null;
      city: string | null;
      source: string | null;
      status: LeadStatus;
      remark: LeadRemark | null;
      notes: string | null;
      assignedToId: string | null;
      teamId: string | null;
    }> = [];

    for (const [index, row] of raw.entries()) {
      const name = asText(row.Name ?? row.name ?? row.FullName);
      const normalizedMobile = mobile(asText(row.Mobile ?? row.mobile ?? row.Phone));
      if (!name || !normalizedMobile || seen.has(normalizedMobile)) continue;

      seen.add(normalizedMobile);
      const assignedToId = assignmentMode === "EXECUTIVE"
        ? selectedExecutive
        : assignmentMode === "UNASSIGNED"
          ? null
          : eligible[index % eligible.length]?.id ?? null;

      leadsToCreate.push({
        name,
        mobile: normalizedMobile,
        project: asText(row.Project ?? row.project) || null,
        city: asText(row.City ?? row.city) || null,
        source,
        status: status(asText(row.Status ?? row.status ?? "NEW")),
        remark: remark(asText(row.Remark ?? row.remark)),
        notes: asText(row.Notes ?? row.notes) || null,
        assignedToId,
        teamId: assignmentMode === "TEAM_ROUND_ROBIN" ? selectedTeam : null,
      });
    }

    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < leadsToCreate.length; i += batchSize) {
      const batch = leadsToCreate.slice(i, i + batchSize);
      const result = await prisma.lead.createMany({ data: batch, skipDuplicates: true });
      created += result.count;
    }

    // Return a small sample of recently created leads for easier verification in the client
    const recentLeads = await prisma.lead.findMany({
      where: {
        source: source ?? undefined,
        assignedToId: assignmentMode === "UNASSIGNED" ? undefined : selectedExecutive ?? undefined,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(20, Math.max(0, created)),
      select: { id: true, name: true, mobile: true, source: true, assignedToId: true },
    });

    return NextResponse.json({ created, destinationQueue, source, assigned: assignmentMode === "UNASSIGNED" ? 0 : created, sample: recentLeads });
  } catch (error) {
    return NextResponse.json({ message: "Failed to import leads.", error: String(error) }, { status: 500 });
  }
}
