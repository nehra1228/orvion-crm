import { prisma } from "@/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ where: { username: "Meera" } });
  if (!users.length) {
    console.log("No user with username Meera found.");
    return;
  }

  for (const user of users) {
    console.log(`Found user: ${user.id} (${user.username}) role=${user.role}`);
    if (!["ADMIN", "SUPER_ADMIN", "SUPER_HR"].includes(user.role)) {
      console.log(`Skipping user ${user.username} with role ${user.role} (not admin/super).`);
      continue;
    }

    // Unassign leads
    const unassign = await prisma.lead.updateMany({ where: { assignedToId: user.id }, data: { assignedToId: null } });
    console.log(`Unassigned ${unassign.count} leads from user ${user.username}`);

    // Delete executive state
    const execState = await prisma.executiveState.deleteMany({ where: { userId: user.id } });
    console.log(`Deleted ${execState.count} executiveState records`);

    // Remove activities
    const activities = await prisma.activity.deleteMany({ where: { userId: user.id } });
    console.log(`Deleted ${activities.count} activities`);

    // Delete uploads
    const uploads = await prisma.upload.deleteMany({ where: { uploadedById: user.id } });
    console.log(`Deleted ${uploads.count} uploads`);

    // Clear calls executive reference
    const calls = await prisma.call.updateMany({ where: { executiveId: user.id }, data: { executiveId: null } });
    console.log(`Cleared executiveId on ${calls.count} calls`);

    // Clear campaign ownership
    const camps = await prisma.campaign.updateMany({ where: { ownerId: user.id }, data: { ownerId: null } });
    console.log(`Cleared ownerId on ${camps.count} campaigns`);

    // Delete attendances (attendance has onDelete Cascade but do explicit)
    const att = await prisma.attendance.deleteMany({ where: { userId: user.id } });
    console.log(`Deleted ${att.count} attendance records`);

    // Finally delete the user
    try {
      const deleted = await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user: ${deleted.username} (${deleted.id})`);
    } catch (err: any) {
      console.error(`Failed to delete user ${user.username}:`, err?.message || err);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
