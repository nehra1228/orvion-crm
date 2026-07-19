import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadRemark, LeadStatus } from "@prisma/client";
import * as XLSX from "xlsx";

async function parseFile(file: File): Promise<unknown[]> {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = new TextDecoder().decode(buffer);
    const workbook = XLSX.read(text, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function normalizeRow(row: unknown) {
  const record = typeof row === 'object' && row !== null ? row as Record<string, unknown> : {};
  return {
    name: String(record.Name || record.name || record.FullName || record.fullName || '').trim(),
    mobile: String(record.Mobile || record.mobile || record.Phone || record.phone || '').trim(),
    project: String(record.Project || record.project || '').trim() || null,
    city: String(record.City || record.city || '').trim() || null,
    source: String(record.Source || record.source || '').trim() || null,
    status: String(record.Status || record.status || 'NEW').trim(),
    remark: String(record.Remark || record.remark || '').trim() || null,
    notes: String(record.Notes || record.notes || '').trim() || null,
    followUpDate: record.FollowUpDate || record.followUpDate || null,
    assignedToUsername: String(record.AssignedTo || record.assignedTo || '').trim() || null,
  };
}

function normalizeMobile(mobile: string) {
  const digits = String(mobile || '').replace(/[^\d]/g, '');
  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.slice(3);
  }

  if (digits.length === 14 && digits.startsWith('0091')) {
    return digits.slice(4);
  }

  return null;
}

function normalizeName(name: string) {
  return String(name || '').trim().toLowerCase();
}

function parseStatus(status: string) {
  const value = status?.toString()?.trim()?.toUpperCase().replace(/\s+/g, '_');
  const allowed = [
    'NEW',
    'CALLED',
    'INTERESTED',
    'FOLLOW_UP',
    'SITE_VISIT',
    'NEGOTIATION',
    'BOOKED',
    'LOST',
  ];

  return allowed.includes(value) ? value : 'NEW';
}

function parseRemark(remark: string) {
  const value = remark?.toString()?.trim()?.toUpperCase().replace(/\s+/g, '_');
  const allowed = [
    'INTERESTED',
    'NOT_INTERESTED',
    'BUSY',
    'SWITCH_OFF',
    'WRONG_NUMBER',
    'CALLBACK',
    'NO_ANSWER',
    'SITE_VISIT',
    'BOOKED',
    'LOST',
  ];
  return allowed.includes(value) ? value : null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const manualAssignedToId = String(formData.get('assignedToId') || '').trim() || null;
  const manualTeamId = String(formData.get('teamId') || '').trim() || null;
  const assignmentMode = String(formData.get('assignmentMode') || 'AUTO').trim().toUpperCase();
  const doNotAutoAssign = formData.get('doNotAutoAssign') === 'true';

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
  }

  try {
    const rows = await parseFile(file);

    const normalized = rows
      .map(normalizeRow)
      .map((row) => ({
        ...row,
        normalizedMobile: normalizeMobile(row.mobile),
        normalizedName: normalizeName(row.name),
      }));

    const valid = normalized.filter((row) => row.name && row.normalizedMobile);
    const invalidMobileCount = normalized.filter((row) => row.name && !row.normalizedMobile).length;

    const seenPhone = new Set<string>();
    const seenName = new Set<string>();
    let filteredDuplicatePhone = 0;
    let filteredDuplicateName = 0;
    const deduped = [] as Array<typeof valid[number]>;

    for (const row of valid) {
      if (!row.normalizedMobile) {
        continue;
      }

      if (seenPhone.has(row.normalizedMobile)) {
        filteredDuplicatePhone += 1;
        continue;
      }

      if (seenName.has(row.normalizedName)) {
        filteredDuplicateName += 1;
        continue;
      }

      seenPhone.add(row.normalizedMobile);
      seenName.add(row.normalizedName);
      deduped.push(row);
    }

    // collect usernames referenced in file for lookup
      const usernames = Array.from(new Set(deduped.map((r) => String(r.assignedToUsername || '').trim().toLowerCase()).filter(Boolean)));
    let usernameToId: Record<string, string> = {};

    if (usernames.length > 0) {
      const users = await prisma.user.findMany({ where: { username: { in: usernames } } });
      usernameToId = users.reduce((acc, u) => ({ ...acc, [String(u.username).trim().toLowerCase()]: u.id }), {});
    }

    const activeExecs = await prisma.user.findMany({ where: { role: "EXECUTIVE", active: true }, orderBy: [{ username: "asc" }] });
    const activeExecIds = activeExecs.map((exec) => exec.id);

    const leads = deduped
      .filter((row): row is typeof row & { normalizedMobile: string } => Boolean(row.normalizedMobile))
      .map((row, index) => {
        const assignedFromFile = row.assignedToUsername ? usernameToId[String(row.assignedToUsername).trim().toLowerCase()] : null;
        const explicitAssignedId = manualAssignedToId || assignedFromFile;
        const autoAssignedId = !doNotAutoAssign && activeExecIds.length && assignmentMode !== "TEAM" ? activeExecIds[index % activeExecIds.length] : null;
        const assignedToId = assignmentMode === "TEAM" || assignmentMode === "UNASSIGNED" ? null : explicitAssignedId || autoAssignedId;
        const teamId = assignmentMode === "TEAM" ? manualTeamId : null;

        return {
          name: row.name,
          mobile: row.normalizedMobile,
          project: row.project || null,
          city: row.city || null,
          source: row.source || null,
          status: parseStatus(String(row.status || '')) as LeadStatus,
          remark: parseRemark(String(row.remark || '')) as LeadRemark | null,
          notes: row.notes || null,
          followUpDate: row.followUpDate ? new Date(String(row.followUpDate)) : null,
          teamId,
          assignedToId,
        };
      });

    const created = await Promise.all(leads.map((lead) => prisma.lead.create({ data: lead })));
    const assignedCount = created.filter((lead) => Boolean(lead.assignedToId || lead.teamId)).length;

    return NextResponse.json({
      parsed: rows.length,
      valid: valid.length,
      deduped: deduped.length,
      invalidMobileCount,
      filteredDuplicatePhone,
      filteredDuplicateName,
      created: created.length,
      assigned: assignedCount,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to import leads.', error: String(error) }, { status: 500 });
  }
}
