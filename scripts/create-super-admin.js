const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = 'Nehra';
  const password = 'Nehra@1228';
  const email = 'admin@orvion.com';

  const columns = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='User' ORDER BY ordinal_position;"
  );
  const names = columns.map((col) => col.column_name);
  console.log('User columns:', names);

  const hashed = await bcrypt.hash(password, 10);

  const roleValue = 'ADMIN';

  await prisma.$executeRawUnsafe(
    `INSERT INTO "User" ("id", "username", "email", "password", "role", "active", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, CAST($5 AS "Role"), $6, NOW(), NOW())
     ON CONFLICT ("username") DO UPDATE SET
       "email" = EXCLUDED."email",
       "password" = EXCLUDED."password",
       "role" = EXCLUDED."role",
       "active" = EXCLUDED."active",
       "updatedAt" = NOW()`,
    'cuid-super-admin',
    username,
    email,
    hashed,
    roleValue,
    true
  );

  const user = await prisma.$queryRawUnsafe(
    `SELECT "id", "username", "email", "role", "active" FROM "User" WHERE "username" = $1`,
    username
  );
  console.log('Created user:', user);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
