import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAttendanceFromState } from "@/lib/attendance";
import { getCurrentUser } from "@/lib/auth/session";

const hrRoles = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"];

function normalizedRole(role: string) {
  const mapping: Record<string, string> = {
    EXECUTIVE: "Executive",
    TELECALLER: "Telecaller",
    HR: "HR",
    MARKETING: "Marketing",
    ACCOUNTS: "Accounts",
    SUPPORT: "Support",
    QA: "QA",
    COMPANY_ADMIN: "Admin",
    SUPER_ADMIN: "Admin",
    ADMIN: "Admin",
    BRANCH_MANAGER: "Branch Manager",
    DEPARTMENT_MANAGER: "Department Manager",
    TEAM_LEADER: "Team Leader",
  };
  return mapping[role] ?? role;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hrRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "10");
  const search = url.searchParams.get("search")?.trim();
  const department = url.searchParams.get("department")?.toUpperCase();
  const status = url.searchParams.get("status")?.toUpperCase();

  const where: any = {
    AND: [
      { role: { notIn: ["SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN", "SUPER_HR"] } },
      { active: true },
    ],
  };

  if (search) {
    where.AND.push({
      OR: [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (department) {
    where.AND.push({
      OR: [
        { department: { name: { contains: department, mode: "insensitive" } } },
        { role: { equals: department } },
      ],
    });
  }

  if (status) {
    const active = status === "ACTIVE";
    where.AND.push({ active });
  }

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    include: {
      department: true,
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  let executiveStates: any[] = [];
  // Prisma client may be out-of-sync with schema (no generated model access).
  // Fallback to a raw query if `prisma.executiveState` is undefined.
  if (prisma && (prisma as any).executiveState && typeof (prisma as any).executiveState.findMany === "function") {
    executiveStates = await (prisma as any).executiveState.findMany({
      where: { userId: { in: users.map((user) => user.id) } },
    });
  } else {
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      const escaped = ids.map((id) => id.replace(/'/g, "''")).map((id) => `'${id}'`).join(',');
      // Use raw SQL as a temporary fallback until Prisma client is regenerated.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      executiveStates = await (prisma as any).$queryRawUnsafe(
        `SELECT * FROM "ExecutiveState" WHERE "userId" IN (${escaped})`
      );
    } else {
      executiveStates = [];
    }
  }

  const stateByUser = new Map(executiveStates.map((state) => [state.userId, state]));
  const attendanceFor = (user: any) => {
    const state = stateByUser.get(user.id) ?? null;
    return computeAttendanceFromState(state as any);
  };

  const items = users.map((user) => ({
    id: user.id,
    employeeId: `EMP-${user.id.slice(-6).toUpperCase()}`,
    name: user.fullName || user.username,
    email: user.email || "",
    phone: "",
    avatarUrl: "",
    department: user.department?.name || normalizedRole(user.role),
    designation: normalizedRole(user.role),
    executiveId: null,
    executiveName: null,
    status: user.active ? "ACTIVE" : "INACTIVE",
    shift: "MORNING",
    attendance: attendanceFor(user),
    joinedAt: user.createdAt.toISOString(),
    salary: 0,
    ctc: 0,
    attendancePercent: 95,
    lateDays: 0,
    workingHours: 0,
    assignedLeads: 0,
    completedCalls: 0,
    interested: 0,
    booked: 0,
    conversion: 0,
    documents: [],
    leaves: [],
  }));

  const payload = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    metrics: {
      total,
      present: items.filter((item) => item.attendance === "PRESENT").length,
      absent: items.filter((item) => item.attendance === "ABSENT").length,
      halfDay: items.filter((item) => item.attendance === "HALF_DAY").length,
      leave: items.filter((item) => item.attendance === "ON_LEAVE").length,
      late: items.filter((item) => item.attendance === "LATE").length,
      newJoinings: items.length,
      birthdays: 0,
      pendingSalary: items.filter((item) => item.salary === 0).length,
    },
  };

  return NextResponse.json(payload);
}
