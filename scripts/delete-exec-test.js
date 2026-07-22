const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const username = 'executive_test';
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    console.log('User not found:', username);
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

    console.log('Delete transaction result:', result.map(r => (r && typeof r.count === 'number') ? `${r.count} deleted` : 'ok'));
  } catch (err) {
    console.error('Failed to delete user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
