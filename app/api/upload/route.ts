import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

    for (const row of rows) {
      if (!row.Name || !row.Mobile) continue;

      await prisma.lead.create({
        data: {
          name: String(row.Name),
          mobile: String(row.Mobile),
          city: row.City ? String(row.City) : null,
          project: row.Project ? String(row.Project) : null,
          source: row.Source ? String(row.Source) : null,
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to import Excel." },
      { status: 500 }
    );
  }
}