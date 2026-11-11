import { and, eq } from "drizzle-orm";

import { client } from "../client";
import { db } from "../index";
import { repositories, type IndexStatus, type RepositoryVisibility } from "../schema";

export async function createRepository(data: {
  userId: string;
  githubRepoId: bigint;
  owner: string;
  name: string;
  defaultBranch: string;
  visibility: RepositoryVisibility;
}) {
  const [repository] = await db
    .insert(repositories)
    .values({
      ...data,
      indexStatus: "PENDING",
    })
    .returning();

  return repository;
}

export async function getRepositoryById(id: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.id, id),
  });
}

export async function getRepositoryByGithubId(userId: string, githubRepoId: bigint) {
  return db.query.repositories.findFirst({
    where: and(eq(repositories.userId, userId), eq(repositories.githubRepoId, githubRepoId)),
  });
}

export async function getUserRepositories(userId: string) {
  return db.query.repositories.findMany({
    where: eq(repositories.userId, userId),
    orderBy: (repositories, { desc }) => [desc(repositories.createdAt)],
  });
}

export async function updateRepositoryIndexStatus(
  repositoryId: string,
  userId: string,
  status: IndexStatus,
) {
  const [repository] = await db
    .update(repositories)
    .set({
      indexStatus: status,
      updatedAt: new Date(),
    })
    .where(and(eq(repositories.id, repositoryId), eq(repositories.userId, userId)))
    .returning();

  if (!repository) {
    throw new Error("Repository not found");
  }

  return repository;
}

export async function acquireRepositoryIndexLock(
  repositoryId: string,
): Promise<(() => Promise<void>) | null> {
  const connection = await client.reserve();

  try {
    const [{ locked }] = await connection<[{ locked: boolean }]>`
      SELECT pg_try_advisory_lock(hashtextextended(${repositoryId}, 0)) AS locked
    `;

    if (!locked) {
      connection.release();
      return null;
    }

    return async () => {
      try {
        await connection`
          SELECT pg_advisory_unlock(hashtextextended(${repositoryId}, 0))
        `;
      } finally {
        connection.release();
      }
    };
  } catch (error) {
    connection.release();
    throw error;
  }
}

export async function completeRepositoryIndexing(
  repositoryId: string,
  userId: string,
  commitSha?: string,
) {
  const [repository] = await db
    .update(repositories)
    .set({
      indexStatus: "COMPLETED",
      ...(commitSha ? { lastIndexedCommit: commitSha } : {}),
      lastIndexedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(repositories.id, repositoryId), eq(repositories.userId, userId)))
    .returning();

  if (!repository) {
    throw new Error("Repository not found");
  }

  return repository;
}

export async function deleteRepository(repositoryId: string) {
  const [repository] = await db
    .delete(repositories)
    .where(eq(repositories.id, repositoryId))
    .returning();

  return repository;
}
