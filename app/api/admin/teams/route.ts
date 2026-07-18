import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const teams = await prisma.team.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { company: true, department: true },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET teams error:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allow HR and admin roles to create teams
    const allowed = ["HR", "ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN"];
    if (!allowed.includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim().toUpperCase();
    const companyId = String(body?.companyId || "").trim();
    const departmentId = String(body?.departmentId || "").trim();

    if (!name || !code || !companyId) {
      return NextResponse.json({ error: "Name, code and company are required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        code,
        companyId,
        departmentId: departmentId || null,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("POST teams error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Team id is required" }, { status: 400 });
    }

    await prisma.team.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE teams error:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
