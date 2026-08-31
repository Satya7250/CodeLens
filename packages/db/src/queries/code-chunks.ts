import { eq } from "drizzle-orm";

import { db } from "../index";
import { codeChunks } from "../schema";

export async function createCodeChunk(data: {
  repositoryId: string;
  fileId: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding: number[];
}) {
  const [chunk] = await db
    .insert(codeChunks)
    .values(data)
    .returning();

  return chunk;
}

export async function createCodeChunks(
  chunks: {
    repositoryId: string;
    fileId: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    embedding: number[];
  }[],
) {
  if (chunks.length === 0) {
    return [];
  }

  return db.insert(codeChunks).values(chunks).returning();
}

export async function getCodeChunkById(id: string) {
  return db.query.codeChunks.findFirst({
    where: eq(codeChunks.id, id),
  });
}

export async function getChunksByRepository(
  repositoryId: string,
) {
  return db.query.codeChunks.findMany({
    where: eq(codeChunks.repositoryId, repositoryId),
  });
}

export async function getChunksByFile(
  fileId: string,
) {
  return db.query.codeChunks.findMany({
    where: eq(codeChunks.fileId, fileId),
    orderBy: (table, { asc }) => [
      asc(table.startLine),
    ],
  });
}

export async function deleteCodeChunk(id: string) {
  const [chunk] = await db
    .delete(codeChunks)
    .where(eq(codeChunks.id, id))
    .returning();

  return chunk;
}

export async function deleteChunksByFile(
  fileId: string,
) {
  return db
    .delete(codeChunks)
    .where(eq(codeChunks.fileId, fileId))
    .returning();
}

export async function deleteChunksByRepository(
  repositoryId: string,
) {
  return db
    .delete(codeChunks)
    .where(eq(codeChunks.repositoryId, repositoryId))
    .returning();
}
