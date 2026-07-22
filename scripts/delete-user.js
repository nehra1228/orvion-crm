const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: node scripts/delete-user.js <username>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.log('User not found:', username);
    await prisma.$disconnect();
    return;
  }

  const userId = user.id;
  console.log('Deleting user:', username, userId);

  try {
    const result = await prisma.$transaction([
      prisma.activity.deleteMany({ where: { userId } }),
      prisma.call.deleteMany({ where: { executiveId: userId } }),
      prisma.upload.deleteMany({ where: { uploadedById: userId } }),
      prisma.executiveState.deleteMany({ where: { userId } }),
      prisma.lead.deleteMany({ where: { assignedToId: userId } }),
      prisma.campaign.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    console.log('Delete transaction completed.');
    console.log(result.map(r => (r && typeof r.count === 'number') ? `${r.count} deleted` : 'ok'));
  } catch (err) {
    console.error('Failed to delete user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
