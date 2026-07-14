import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const hrRoles = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"];

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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const userIds = url.searchParams.get("userIds")?.split(",").filter(Boolean);

  if (!from || !to) {
    return NextResponse.json({ error: "from and to date range required" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "from cannot be after to" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { notIn: ["SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"] },
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    include: {
      department: true,
    },
    orderBy: { fullName: "asc" },
  });

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      day: { gte: from, lte: to },
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    orderBy: [{ userId: "asc" }, { day: "asc" }],
  });

  const recordsByUser = new Map<string, Record<string, any>>();
  attendanceRecords.forEach((record) => {
    const key = `${record.userId}:${record.day}`;
    recordsByUser.set(key, record);
  });

  const days: string[] = [];
  let current = new Date(from);
  const endDate = new Date(to);
  while (current <= endDate) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, "0");
    const day = String(current.getUTCDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const items = users.flatMap((user) =>
    days.map((day) => {
      const record = recordsByUser.get(`${user.id}:${day}`);
      return {
        day,
        employeeId: `EMP-${user.id.slice(-6).toUpperCase()}`,
        name: user.fullName || user.username,
        email: user.email || "",
        department: user.department?.name || normalizedRole(user.role),
        role: normalizedRole(user.role),
        status: record?.status || "ABSENT",
        createdAt: record?.createdAt.toISOString() || new Date().toISOString(),
      };
    })
  );

  return NextResponse.json({ items });
}
