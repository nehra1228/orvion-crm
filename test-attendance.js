const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const records = await prisma.attendance.findMany({
      where: { day: "2026-07-19" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
    });
    console.log("Attendance records for 2026-07-19:", JSON.stringify(records, null, 2));
    
    // Also check the users table
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, username: true, fullName: true, role: true, email: true },
    });
    console.log("\nActive users:", JSON.stringify(users, null, 2));
  } finally {
    await prisma.$disconnect();
  }
})();
