import { eq } from "drizzle-orm";

import { db } from "../index";
import { repositoryFiles } from "../schema";

export async function createRepositoryFile(data: {
  repositoryId: string;
  path: string;
  sha: string;
  size: number;
  language?: string | null;
}) {
  const [file] = await db.insert(repositoryFiles).values(data).returning();

  return file;
}

export async function createRepositoryFiles(
  files: {
    repositoryId: string;
    path: string;
    sha: string;
    size: number;
    language?: string | null;
  }[],
) {
  if (files.length === 0) {
    return [];
  }

  return db.insert(repositoryFiles).values(files).returning();
}

export async function getRepositoryFileById(id: string) {
  return db.query.repositoryFiles.findFirst({
    where: eq(repositoryFiles.id, id),
  });
}

export async function getRepositoryFiles(repositoryId: string) {
  return db.query.repositoryFiles.findMany({
    where: eq(repositoryFiles.repositoryId, repositoryId),
    orderBy: (repositoryFiles, { asc }) => [asc(repositoryFiles.path)],
  });
}

export async function getRepositoryFileByPath(repositoryId: string, path: string) {
  const files = await db.query.repositoryFiles.findMany({
    where: eq(repositoryFiles.repositoryId, repositoryId),
  });

  return files.find((file) => file.path === path) ?? null;
}

export async function updateRepositoryFile(
  fileId: string,
  data: {
    sha?: string;
    size?: number;
    language?: string | null;
  },
) {
  const [file] = await db
    .update(repositoryFiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(repositoryFiles.id, fileId))
    .returning();

  return file;
}

export async function deleteRepositoryFile(fileId: string) {
  const [file] = await db.delete(repositoryFiles).where(eq(repositoryFiles.id, fileId)).returning();

  return file;
}

export async function deleteRepositoryFiles(repositoryId: string) {
  return db
    .delete(repositoryFiles)
    .where(eq(repositoryFiles.repositoryId, repositoryId))
    .returning();
}
