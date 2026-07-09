const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log("✅ Prisma connected");
  await prisma.$disconnect();
}

main().catch(console.error);
