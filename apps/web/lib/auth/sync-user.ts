import { currentUser } from "@clerk/nextjs/server";

import { createUser, getUserByClerkId } from "@repo/db";

export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const existingUser = await getUserByClerkId(clerkUser.id);

  if (existingUser) {
    return existingUser;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User email not found");
  }

  const user = await createUser({
    clerkId: clerkUser.id,
    email,
  });

  return user;
}
