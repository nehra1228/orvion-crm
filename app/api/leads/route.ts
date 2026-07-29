import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// GET ALL LEADS
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || undefined;
    const remark = String(searchParams.get("remark") || "").trim().toUpperCase() || undefined;
    const executiveId = searchParams.get("executiveId") || undefined;
    const teamId = searchParams.get("teamId") || undefined;
    const city = searchParams.get("city") || undefined;
    const project = searchParams.get("project") || undefined;
    const source = searchParams.get("source") || undefined;
    const createdFrom = searchParams.get("createdFrom") || undefined;
    const createdTo = searchParams.get("createdTo") || undefined;
    const followUpFrom = searchParams.get("followUpFrom") || undefined;
    const followUpTo = searchParams.get("followUpTo") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "10");

    const where: Record<string, unknown> = {};

    if (user.role === "EXECUTIVE") {
      where.assignedToId = user.id;
    } else if (user.role === "TEAM_LEADER") {
      where.teamId = user.teamId;
    }

    if (executiveId) {
      where.assignedToId = executiveId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (status) {
      where.status = status;
    }

    if (remark) {
      if (remark === "REMARKED") {
        where.remark = { not: null };
      } else {
        where.remark = remark;
      }
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (project) {
      where.project = { contains: project, mode: "insensitive" };
    }

    if (source) {
      where.source = { contains: source, mode: "insensitive" };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(`${createdFrom}T00:00:00.000Z`);
      }
      if (createdTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(`${createdTo}T23:59:59.999Z`);
      }
    }

    if (followUpFrom || followUpTo) {
      where.followUpDate = {};
      if (followUpFrom) {
        (where.followUpDate as Record<string, Date>).gte = new Date(`${followUpFrom}T00:00:00.000Z`);
      }
      if (followUpTo) {
        (where.followUpDate as Record<string, Date>).lte = new Date(`${followUpTo}T23:59:59.999Z`);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { project: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { assignedTo: { is: { username: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const total = await prisma.lead.count({ where });
    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            businessType: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items: leads,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("GET Leads Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// CREATE NEW LEAD
export async function POST(req: Request) {
  try {
    const body = await req.json();

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

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        mobile: body.mobile,
        project: body.project || null,
        city: body.city || null,
        source: body.source || null,
        notes: body.notes || null,
        companyId: defaultCompany?.id ?? null,
        departmentId: defaultDepartment?.id ?? null,
        teamId: defaultTeam?.id ?? null,
      },
    });

    return NextResponse.json(lead, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Lead Error:", error);

    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}