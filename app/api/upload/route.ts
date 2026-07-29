import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const seemsLikePhone = (value: string) => {
  const normalized = String(value ?? "").trim();
  const digits = normalized.replace(/\D/g, "");
  return Boolean(digits.length >= 7 && /^[0-9()+\s-]+$/.test(normalized));
};

const isMissingName = (value: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !normalized || /^(no\s*name|unknown|unnamed)$/.test(normalized) || seemsLikePhone(normalized);
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    let imported = 0;
    let duplicates = 0;

    const defaultCompany = await prisma.company.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const defaultDepartment = defaultCompany
      ? await prisma.department.findFirst({
          where: { companyId: defaultCompany.id },
          orderBy: { createdAt: "asc" },
        })
      : null;

    const defaultTeam = defaultDepartment
      ? await prisma.team.findFirst({
          where: { departmentId: defaultDepartment.id },
          orderBy: { createdAt: "asc" },
        })
      : null;

    for (const row of rows) {
      const rowName = row.Name ? String(row.Name).trim() : "";
      const rowMobile = row.Mobile ? String(row.Mobile).trim() : "";
      if (isMissingName(rowName) || !rowMobile) continue;

      await prisma.lead.create({
        data: {
          name: rowName,
          mobile: rowMobile,
          city: row.City ? String(row.City) : null,
          project: row.Project ? String(row.Project) : null,
          source: row.Source ? String(row.Source) : null,
          companyId: defaultCompany?.id ?? null,
          departmentId: defaultDepartment?.id ?? null,
          teamId: defaultTeam?.id ?? null,
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      company: defaultCompany?.name || null,
      department: defaultDepartment?.name || null,
      team: defaultTeam?.name || null,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to import Excel." },
      { status: 500 }
    );
  }
}