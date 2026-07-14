const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRawUnsafe(`
    SELECT t.typname AS enum_name, e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'Role'
    ORDER BY e.enumsortorder;
  `);
  console.log(JSON.stringify(enums, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
