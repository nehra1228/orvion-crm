import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET companies error:", error);
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim().toUpperCase();
    const businessType = String(body?.businessType || "REAL_ESTATE").toUpperCase();

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        code,
        businessType: businessType === "INSURANCE" ? "INSURANCE" : "REAL_ESTATE",
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("POST companies error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 });
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE companies error:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
