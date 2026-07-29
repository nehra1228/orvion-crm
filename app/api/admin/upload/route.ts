import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadRemark, LeadStatus } from "@prisma/client";
import * as XLSX from "xlsx";

const queueSource: Record<string, string> = { TODAY_LEADS: "Leads", CALLING_DATA: "Calling data", AUTOCALLER: "Autocaller data" };
const asText = (value: unknown) => String(value ?? "").trim();
const firstValue = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      const text = asText(value);
      if (text) return text;
    }
  }
  return "";
};
const mobile = (value: string) => { const digits = value.replace(/\D/g, ""); if (digits.length === 10) return digits; if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2); return null; };
const status = (value: string) => (["NEW", "CALLED", "INTERESTED", "FOLLOW_UP", "SITE_VISIT", "NEGOTIATION", "BOOKED", "LOST"].includes(value) ? value : "NEW") as LeadStatus;
const seemsLikePhone = (value: string) => {
  const normalized = String(value ?? "").trim();
  const digits = normalized.replace(/\D/g, "");
  return Boolean(digits.length >= 7 && /^[0-9()+\s-]+$/.test(normalized));
};
const isMissingName = (value: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !normalized || /^(no\s*name|unknown|unnamed)$/.test(normalized) || seemsLikePhone(normalized);
};
const remark = (value: string) => {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "FOLLOW_UP" || normalized === "FOLLOW UP" || normalized === "FOLLOWUP") {
    return LeadRemark.CALLBACK;
  }
  return (["INTERESTED", "NOT_INTERESTED", "BUSY", "SWITCH_OFF", "WRONG_NUMBER", "CALLBACK", "NO_ANSWER", "SITE_VISIT", "BOOKED", "LOST"].includes(normalized) ? normalized : null) as LeadRemark | null;
};

export async function POST(request: Request) {
  const form = await request.formData(); 
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file provided." }, { status: 400 });
  }
  try {
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
    const buffer = await file.arrayBuffer();
    const book = XLSX.read(buffer, { type: "array" });
    const sheet = book.Sheets[book.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json({ message: "The uploaded file did not contain any usable worksheet data." }, { status: 400 });
    }

    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    console.log(`Parsed ${raw.length} rows from sheet`);
    
    const assignmentMode = asText(form.get("assignmentMode") || "ROUND_ROBIN").toUpperCase();
    const destinationQueue = asText(form.get("destinationQueue") || form.get("executiveQueue") || "TODAY_LEADS").toUpperCase();
    let selectedExecutive = asText(form.get("assignedToId") || form.get("executiveId")) || null;
    const selectedTeam = asText(form.get("teamId")) || null;
    const source = queueSource[destinationQueue] ?? (asText(form.get("source") || form.get("uploadSource")) || null);
    
    console.log(`Assignment: ${assignmentMode}, Queue: ${destinationQueue}, Executive: ${selectedExecutive}`);
    
    const allExecutives = await prisma.user.findMany({ where: { role: "EXECUTIVE", active: true }, orderBy: { username: "asc" }, select: { id: true, teamId: true, username: true } });
    console.log(`Found ${allExecutives.length} active executives`);
    
    const eligible = assignmentMode === "TEAM_ROUND_ROBIN" ? allExecutives.filter((user) => user.teamId === selectedTeam) : allExecutives;
    if (assignmentMode === "TEAM_ROUND_ROBIN" && (!selectedTeam || !eligible.length)) return NextResponse.json({ message: "The selected team has no active executives." }, { status: 400 });

    if (selectedExecutive) {
      const foundById = allExecutives.find((user) => user.id === selectedExecutive);
      if (!foundById) {
        const foundByUsername = allExecutives.find((user) => user.username === selectedExecutive);
        if (foundByUsername) selectedExecutive = foundByUsername.id;
      }
    }

    if (assignmentMode === "EXECUTIVE" && !selectedExecutive) return NextResponse.json({ message: "Choose an executive." }, { status: 400 });

    const seen = new Set<string>();
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const [index, row] of raw.entries()) {
      const name = firstValue(row, ["Name", "name", "FullName", "fullName"]);
      const normalizedName = String(name ?? "").trim();
      const normalizedMobile = mobile(firstValue(row, ["Mobile", "mobile", "Phone", "phone", "Contact", "contact"]));
      if (isMissingName(normalizedName) || !normalizedMobile || seen.has(normalizedMobile)) {
        skipped += 1;
        continue;
      }

      seen.add(normalizedMobile);
      const assignedToId = assignmentMode === "EXECUTIVE"
        ? selectedExecutive
        : assignmentMode === "UNASSIGNED"
          ? null
          : eligible[index % eligible.length]?.id ?? null;

      try {
        await prisma.lead.create({
          data: {
            name,
            mobile: normalizedMobile,
            project: firstValue(row, ["Project", "project"]) || null,
            city: firstValue(row, ["City", "city"]) || null,
            source,
            status: status(firstValue(row, ["Status", "status", "LeadStatus"]) || "NEW"),
            remark: remark(firstValue(row, ["Remark", "remark", "Disposition"])) || null,
            notes: firstValue(row, ["Notes", "notes"]) || null,
            assignedToId,
            teamId: assignmentMode === "TEAM_ROUND_ROBIN" ? selectedTeam : null,
          },
        });
        created += 1;
      } catch (error) {
        errors += 1;
        console.error("Failed to import lead row", index + 1, name, error);
      }
    }

    console.log(`Upload complete: created=${created}, skipped=${skipped}, errors=${errors}`);

    const recentLeads = created > 0 ? await prisma.lead.findMany({
      where: {
        source: source ?? undefined,
        assignedToId: assignmentMode === "UNASSIGNED" ? undefined : selectedExecutive ?? undefined,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(20, Math.max(0, created)),
      select: { id: true, name: true, mobile: true, source: true, assignedToId: true },
    }) : [];

    return NextResponse.json({ created, skipped, errors, destinationQueue, source, assigned: assignmentMode === "UNASSIGNED" ? 0 : created, sample: recentLeads });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Lead upload failed:", errorMessage, error);
    return NextResponse.json({ message: `Failed to import leads: ${errorMessage}`, error: errorMessage }, { status: 500 });
  }
}

