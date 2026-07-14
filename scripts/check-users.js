require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, active: true, teamId: true, companyId: true, departmentId: true },
      orderBy: { username: 'asc' },
      take: 200,
    });

    console.log('Users:', users.length);

    const grouped = users.reduce((acc, u) => {
      acc[u.role] = acc[u.role] || [];
      acc[u.role].push(u);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([role, list]) => {
      console.log(`\nRole ${role} (${list.length}):`);
      list.forEach((u) => {
        console.log(`- ${u.username} id=${u.id} active=${u.active} teamId=${u.teamId || 'null'} companyId=${u.companyId || 'null'} dept=${u.departmentId || 'null'}`);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
