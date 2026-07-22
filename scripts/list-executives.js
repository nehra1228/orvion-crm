const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const execs = await prisma.user.findMany({ where: { role: 'EXECUTIVE' }, select: { id: true, username: true, email: true } });
  if (!execs || execs.length === 0) {
    console.log('No executives found');
    await prisma.$disconnect();
    return;
  }
  console.log('Executives:');
  execs.forEach(e => console.log(`- ${e.username} (${e.id}) ${e.email ? '<' + e.email + '>' : ''}`));
  await prisma.$disconnect();
}

main();
