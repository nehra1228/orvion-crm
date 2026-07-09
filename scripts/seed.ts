import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "",
  }),
});

async function main() {
  const exists = await prisma.user.findUnique({
    where: {
      username: "admin",
    },
  });

  if (exists) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await hashPassword("Admin@123");

  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@orvioncrm.com",
      password: hashedPassword,
      role: Role.ADMIN,
      active: true,
    },
  });

  console.log("? Admin created");
}

async function createExecutive() {
  const exists = await prisma.user.findUnique({ where: { username: "tanzeel" } });
  if (exists) {
    console.log("Executive already exists");
    return;
  }

  const hashed = await hashPassword("Exec@123");

  await prisma.user.create({
    data: {
      username: "tanzeel",
      email: "tanzeel@example.com",
      password: hashed,
      role: Role.EXECUTIVE,
      active: true,
    },
  });

  console.log("? Executive created (username: tanzeel, password: Exec@123)");
}

async function seedAll() {
  await main();
  await createExecutive();
}

seedAll()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
