import { and, eq } from "drizzle-orm";

import { db } from "../index";
import {
  repositories,
  type IndexStatus,
  type RepositoryVisibility,
} from "../schema";

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
    .values(data)
    .returning();

  return repository;
}

export async function getRepositoryById(id: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.id, id),
  });
}

export async function getRepositoryByGithubId(
  userId: string,
  githubRepoId: bigint,
) {
  return db.query.repositories.findFirst({
    where: and(
      eq(repositories.userId, userId),
      eq(repositories.githubRepoId, githubRepoId),
    ),
  });
}

export async function getUserRepositories(userId: string) {
  return db.query.repositories.findMany({
    where: eq(repositories.userId, userId),
    orderBy: (repositories, { desc }) => [
      desc(repositories.createdAt),
    ],
  });
}

export async function updateRepositoryIndexStatus(
  repositoryId: string,
  status: IndexStatus,
) {
  const [repository] = await db
    .update(repositories)
    .set({
      indexStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(repositories.id, repositoryId))
    .returning();

  return repository;
}

export async function updateLastIndexedCommit(
  repositoryId: string,
  commitSha: string,
) {
  const [repository] = await db
    .update(repositories)
    .set({
      lastIndexedCommit: commitSha,
      lastIndexedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(repositories.id, repositoryId))
    .returning();

  return repository;
}

export async function deleteRepository(repositoryId: string) {
  const [repository] = await db
    .delete(repositories)
    .where(eq(repositories.id, repositoryId))
    .returning();

  return repository;
}
