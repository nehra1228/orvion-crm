import { prisma } from "@/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({ where: { username: "Meera" } });
  console.log("Found user:", user);
  if (!user) {
    console.error("Meera user not found.");
    process.exit(1);
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "SUPER_HR", active: true },
  });
  console.log("Updated user:", updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
