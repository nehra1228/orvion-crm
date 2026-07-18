import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;

    const departments = await prisma.department.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { company: true },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET departments error:", error);
    return NextResponse.json({ error: "Failed to load departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim().toUpperCase();
    const companyId = String(body?.companyId || "").trim();

    if (!name || !code || !companyId) {
      return NextResponse.json({ error: "Name, code and company are required" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        companyId,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("POST departments error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Department id is required" }, { status: 400 });
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE departments error:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
