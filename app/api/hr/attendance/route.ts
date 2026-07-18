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

  const isSuperHr = user.role === "SUPER_ADMIN";
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

  const recordsByUser = new Map<string, (typeof attendanceRecords)[number]>();
  attendanceRecords.forEach((record) => {
    const key = `${record.userId}:${record.day}`;
    recordsByUser.set(key, record);
  });

  const days: string[] = [];
  const current = new Date(from);
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

  const counts = {
    present: items.filter((item) => item.status === "PRESENT").length,
    absent: items.filter((item) => item.status === "ABSENT").length,
    halfDay: items.filter((item) => item.status === "HALF_DAY").length,
    leave: items.filter((item) => item.status === "ON_LEAVE").length,
    late: items.filter((item) => item.status === "LATE").length,
    total: items.length,
  };

  const format = url.searchParams.get("format");
  if (format === "csv") {
    if (!isSuperHr) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const headers = ["day", "employeeId", "name", "email", "department", "role", "status", "createdAt"];
    const escape = (s: unknown) => {
      if (s === undefined || s === null) return "";
      const str = String(s);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const rows = [headers.join(",")].concat(
      items.map((it) => {
        const record = it as Record<string, string | undefined>;
        return headers.map((h) => escape(record[h])).join(",");
      })
    );
    const csv = rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${from}-${to}.csv"`,
      },
    });
  }

  if (!isSuperHr) {
    return NextResponse.json({ counts, items: [] });
  }

  return NextResponse.json({ counts, items });
}
