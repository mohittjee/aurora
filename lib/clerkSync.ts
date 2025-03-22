import { prisma } from "./prisma"; // Adjust path to your Prisma client
import { User } from "@clerk/nextjs/server"; // Clerk's User type

export async function syncClerkUser(clerkUser: User | null) {
  if (!clerkUser) return null;

  const existingUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!existingUser) {
    return await prisma.user.create({
      data: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: clerkUser.firstName || clerkUser.username || "Unknown",
        googleId: clerkUser.externalAccounts.find(acc => acc.provider === "google")?.externalId,
      },
    });
  }

  return existingUser;
}