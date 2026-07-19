import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAttendanceDay } from "@/lib/attendance";

const hrRoles = ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"];
const OFFICE_NETWORKS = [
  // Your current office Wi-Fi subnet.
  "192.168.1.0/24",
];

function parseIpv4(ip: string): number | null {
  if (!ip) return null;
  // Normalize IPv6-mapped IPv4 (e.g. ::ffff:192.168.1.5) and strip ports
  const m = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  const ipv4 = m ? m[1] : ip.trim();
  const parts = ipv4.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  // Compute unsigned 32-bit integer without bitwise sign issues
  const num = (((((nums[0] * 256) + nums[1]) * 256) + nums[2]) * 256) + nums[3];
  return num >>> 0;
}

function matchesCidr(ip: string, cidr: string): boolean {
  const [range, prefixLength = "32"] = cidr.split("/");
  const ipNum = parseIpv4(ip);
  const rangeNum = parseIpv4(range);
  const prefix = Number(prefixLength);
  if (ipNum === null || rangeNum === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  // Build unsigned mask correctly
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  return ((ipNum & mask) >>> 0) === ((rangeNum & mask) >>> 0);
}

function getClientIp(request: Request): string | null {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0].trim();
    const m = first.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (m) return m[1];
    return first || null;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    const m = realIp.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (m) return m[1];
    return realIp.trim();
  }
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
  if (!hrRoles.includes(String(current.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const status = (body.status || "PRESENT").toString().toUpperCase();
  const allowedStatuses = ["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
  }

  // Super HRs are not permitted to mark attendance (they can only view).
  if (String(current.role) === "SUPER_HR") {
    return NextResponse.json({ error: "Super HR role is not permitted to mark attendance." }, { status: 403 });
  }

  const userId = body.userId ? String(body.userId) : current.id;
  // Only SUPER_ADMIN may mark attendance for other users; others can only mark themselves.
  if (String(current.role) !== "SUPER_ADMIN" && userId !== current.id) {
    return NextResponse.json({ error: "Only Super Admin can mark attendance for other users." }, { status: 403 });
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
