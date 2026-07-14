const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(
    `SELECT "username", "password", "role", "active" FROM "User" WHERE "username" = $1`,
    'Nehra'
  );
  console.log(JSON.stringify(users, null, 2));
  if (users[0]) {
    const ok = await bcrypt.compare('Nehra@1228', users[0].password);
    console.log('password_ok', ok);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
