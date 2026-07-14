import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash("Nehra@1228", 10);

  await prisma.user.upsert({
    where: {
      username: "Nehra",
    },
    update: {
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      active: true,
    },
    create: {
      username: "Nehra",
      email: "admin@orvion.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      active: true,
    },
  });

  console.log("✅ Admin Ready");
}

async function seedExecutive() {
  const hashedPassword = await bcrypt.hash("Exec@123", 10);

  await prisma.user.upsert({
    where: {
      username: "tanzeel",
    },
    update: {
      password: hashedPassword,
      role: Role.EXECUTIVE,
      active: true,
    },
    create: {
      username: "tanzeel",
      email: "tanzeel@example.com",
      password: hashedPassword,
      role: Role.EXECUTIVE,
      active: true,
    },
  });

  console.log("✅ Executive Ready");
}

async function seedHR() {
  const hashedPassword = await bcrypt.hash("Meera@1228", 10);

  await prisma.user.upsert({
    where: {
      username: "Meera",
    },
    update: {
      password: hashedPassword,
      role: Role.HR,
      active: true,
    },
    create: {
      username: "Meera",
      email: "meera@example.com",
      password: hashedPassword,
      role: Role.HR,
      active: true,
    },
  });

  console.log("✅ HR Ready");
}

async function main() {
  console.log("🌱 Seeding ORVION CRM...");

  await seedAdmin();
  await seedExecutive();
  await seedHR();

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });