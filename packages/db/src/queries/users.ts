import { eq } from "drizzle-orm";

import { db } from "../index";
import { users } from "../schema";

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUserByClerkId(clerkId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
}

export async function createUser(data: {
  clerkId: string;
  email: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      clerkId: data.clerkId,
      email: data.email,
    })
    .returning();

  return user;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
  },
) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user;
}

export async function deleteUser(id: string) {
  const [user] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return user;
}
