import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAttendanceDay } from "@/lib/attendance";
import { getCurrentUser } from "@/lib/auth/session";

const adminRoles = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"];
function isAdminRole(role: string) {
  return adminRoles.includes(role);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetUserId = userId || user.id;
  if (targetUserId !== user.id && !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = await prisma.executiveState.findUnique({ where: { userId: targetUserId } });
  return NextResponse.json({ state: state ?? { userId: targetUserId, status: "OFFLINE", lastSeen: new Date() } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    let { userId, status, note } = body;
    if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

    const targetUserId = userId || user.id;
    if (targetUserId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (targetUserId === user.id && user.role !== "EXECUTIVE") {
      return NextResponse.json({ error: "Only executives can update their own attendance state." }, { status: 403 });
    }

    status = status.toString().toUpperCase();
    const validStatuses = ["PRESENT", "LATE", "HALF_DAY", "ON_LEAVE", "ABSENT", "OFFLINE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status !== "OFFLINE") {
      const day = getAttendanceDay();
      await prisma.attendance.upsert({
        where: { userId_day: { userId: targetUserId, day } },
        create: { userId: targetUserId, day, status, note: note ? String(note) : undefined },
        update: { status, note: note ? String(note) : undefined },
      });
    }

    const up = await prisma.executiveState.upsert({
      where: { userId: targetUserId },
      update: { status, lastSeen: new Date() },
      create: { userId: targetUserId, status, lastSeen: new Date() },
    });

    return NextResponse.json({ success: true, state: up });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
