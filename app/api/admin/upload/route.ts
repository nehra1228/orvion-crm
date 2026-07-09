import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadRemark, LeadStatus } from "@prisma/client";
import * as XLSX from "xlsx";

async function parseFile(file: File) {
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

function normalizeRow(row: any) {
  return {
    name: String(row.Name || row.name || row.FullName || row.fullName || '').trim(),
    mobile: String(row.Mobile || row.mobile || row.Phone || row.phone || '').trim(),
    project: row.Project || row.project || null,
    city: row.City || row.city || null,
    source: row.Source || row.source || null,
    status: row.Status || row.status || 'NEW',
    remark: row.Remark || row.remark || null,
    notes: row.Notes || row.notes || null,
    followUpDate: row.FollowUpDate || row.followUpDate || null,
    assignedToUsername: row.AssignedTo || row.assignedTo || null,
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
  const manualAssignedToId = formData.get('assignedToId') as string | null;
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
    const usernames = Array.from(new Set(deduped.map((r) => (r.assignedToUsername || '')).filter(Boolean)));
    let usernameToId: Record<string, string> = {};

    if (usernames.length > 0) {
      const users = await prisma.user.findMany({ where: { username: { in: usernames } } });
      usernameToId = users.reduce((acc, u) => ({ ...acc, [u.username]: u.id }), {});
    }

    const activeExecs = await prisma.user.findMany({ where: { role: "EXECUTIVE", active: true }, orderBy: [{ username: "asc" }] });
    const activeExecIds = activeExecs.map((exec) => exec.id);

    const leads = deduped
      .filter((row): row is typeof row & { normalizedMobile: string } => Boolean(row.normalizedMobile))
      .map((row, index) => {
        const assignedFromFile = row.assignedToUsername ? usernameToId[row.assignedToUsername] : null;
        const autoAssignedId = !doNotAutoAssign && activeExecIds.length ? activeExecIds[index % activeExecIds.length] : null;
        const assignedToId = manualAssignedToId || assignedFromFile || autoAssignedId;

        return {
          name: row.name,
          mobile: row.normalizedMobile,
          project: row.project || null,
          city: row.city || null,
          source: row.source || null,
          status: parseStatus(row.status) as LeadStatus,
          remark: parseRemark(row.remark) as LeadRemark | null,
          notes: row.notes || null,
          followUpDate: row.followUpDate ? new Date(row.followUpDate) : null,
          assignedToId,
        };
      });

    const created = await Promise.all(leads.map((lead) => prisma.lead.create({ data: lead })));

    return NextResponse.json({ parsed: rows.length, valid: valid.length, deduped: deduped.length, invalidMobileCount, filteredDuplicatePhone, filteredDuplicateName, created: created.length });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to import leads.', error: String(error) }, { status: 500 });
  }
}
