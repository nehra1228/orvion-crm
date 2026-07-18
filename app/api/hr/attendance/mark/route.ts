import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAttendanceDay } from "@/lib/attendance";

const hrRoles = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"];
const OFFICE_NETWORKS = [
  // Your current office Wi-Fi subnet.
  "192.168.1.0/24",
];

function parseIpv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => Number(part));
  if (bytes.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((bytes[0] << 24) >>> 0) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
}

function matchesCidr(ip: string, cidr: string): boolean {
  const [range, prefixLength = "32"] = cidr.split("/");
  const ipNum = parseIpv4(ip);
  const rangeNum = parseIpv4(range);
  const prefix = Number(prefixLength);
  if (ipNum === null || rangeNum === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : ~0 << (32 - prefix);
  return (ipNum & mask) >>> 0 === (rangeNum & mask) >>> 0;
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((ip) => ip.trim()).find(Boolean);
  if (forwarded) return forwarded;
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

function isOfficeNetwork(request: Request): boolean {
  const ip = getClientIp(request);
  if (!ip) return false;
  return OFFICE_NETWORKS.some((cidr) => matchesCidr(ip, cidr));
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hrRoles.includes(current.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const status = (body.status || "PRESENT").toString().toUpperCase();
  const allowedStatuses = ["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
  }

  const userId = body.userId ? String(body.userId) : current.id;
  if (current.role !== "SUPER_ADMIN" && userId !== current.id) {
    return NextResponse.json({ error: "Only Super HR can mark attendance for other users." }, { status: 403 });
  }

  const day = body.day ? String(body.day) : getAttendanceDay();

  if (!isOfficeNetwork(request)) {
    return NextResponse.json({ error: "Unknown network: mark-in only permitted from office network." }, { status: 403 });
  }

  try {
    const record = await prisma.attendance.upsert({
      where: {
        userId_day: {
          userId,
          day,
        },
      },
      create: {
        userId,
        day,
        status,
      },
      update: {
        status,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("/api/hr/attendance/mark error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to mark attendance." }, { status: 500 });
  }
}
