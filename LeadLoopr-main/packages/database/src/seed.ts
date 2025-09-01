import { prisma } from "./client";

import type { User } from "../generated/client";

const DEFAULT_USERS = [
  // Add your own user to pre-populate the database with
  {
    clerkId: "seed_user_1",
    firstName: "Tim",
    lastName: "Apple",
    email: "tim@apple.com",
  },
] as Array<Partial<User>>;

const DEFAULT_STAGES = [
                { name: "Proposal", position: 1, color: "bg-purple-500" },
                { name: "Qualified", position: 2, color: "bg-orange-500" },
                { name: "Sales Contact", position: 3, color: "bg-green-500" },
                { name: "Lost", position: 5, color: "bg-red-500" },
                { name: "Won", position: 4, color: "bg-emerald-500" },
            ];
 
(async () => {
  try {
    // Create or update users
    const users = await Promise.all(
      DEFAULT_USERS.map((user) =>
        prisma.user.upsert({
          where: {
            email: user.email!,
          },
          update: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
          create: {
            clerkId: user.clerkId!,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email!,
          },
        })
      )
    );

    // Create a default organization if it doesn't exist
    // First check if it exists
    let defaultOrg = await prisma.organization.findFirst({
      where: {
        name: "Default Organization",
      },
    });

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: "Default Organization",
          website: "https://example.com",
        },
      });
    }

    // Create default pipeline stages
    await Promise.all(
      DEFAULT_STAGES.map((stage) =>
        prisma.pipelineStage.upsert({
          where: {
            organizationId_name: {
              organizationId: defaultOrg!.id,
              name: stage.name,
            },
          },
          update: {
            position: stage.position,
            color: stage.color,
          },
          create: {
            organizationId: defaultOrg!.id,
            name: stage.name,
            position: stage.position,
            color: stage.color,
          },
        })
      )
    );

    // Associate users with the default organization
    await Promise.all(
      users.map((user) =>
        prisma.organizationUser.upsert({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: defaultOrg.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            organizationId: defaultOrg.id,
          },
        })
      )
    );

    // Set the first user's current organization
    if (users.length > 0) {
      await prisma.user.update({
        where: { id: users[0].id },
        data: { currentOrganizationId: defaultOrg.id },
      });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
