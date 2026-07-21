import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("orvion_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token) as {
      sub: string;
      username: string;
      role: string;
    };

    if (!payload?.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName || null,
      role: user.role,
      active: user.active,
      companyId: user.companyId,
      departmentId: user.departmentId,
      teamId: user.teamId,
    };
  } catch {
    return null;
  }
}

export async function requireUser(role: "ADMIN" | "EXECUTIVE") {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isExecutive = user.role === "EXECUTIVE";
  const isAdminRole =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "COMPANY_ADMIN" ||
    user.role === "HR" ||
    user.role === "SUPER_HR";

  if (role === "EXECUTIVE") {
    if (isExecutive) {
      return user;
    }
    if (isAdminRole) {
      redirect("/admin/dashboard");
    }
    redirect("/login");
  }

  if (role === "ADMIN") {
    if (isAdminRole) {
      return user;
    }
    if (isExecutive) {
      redirect("/executive/dashboard");
    }
    redirect("/login");
  }

  redirect("/login");
}
