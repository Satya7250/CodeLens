import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "../index";
import { codeChunks } from "../schema";

export async function createCodeChunk(data: {
  repositoryId: string;
  fileId: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding?: number[] | null;
}) {
  const [chunk] = await db.insert(codeChunks).values(data).returning();

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
    embedding?: number[] | null;
  }[],
) {
  if (chunks.length === 0) {
    return [];
  }

  return db.insert(codeChunks).values(chunks).returning();
}

export async function getChunksMissingEmbeddings(repositoryId: string) {
  return db
    .select({
      id: codeChunks.id,
      content: codeChunks.content,
    })
    .from(codeChunks)
    .where(and(eq(codeChunks.repositoryId, repositoryId), isNull(codeChunks.embedding)));
}

export async function getRepositoryChunkEmbeddingStats(repositoryId: string) {
  const [stats] = await db
    .select({
      totalChunks: sql<number>`count(*)::int`,
      missingEmbeddings: sql<number>`count(*) FILTER (WHERE ${codeChunks.embedding} IS NULL)::int`,
      invalidDimensions: sql<number>`count(*) FILTER (
        WHERE ${codeChunks.embedding} IS NOT NULL
          AND vector_dims(${codeChunks.embedding}) <> 1536
      )::int`,
    })
    .from(codeChunks)
    .where(eq(codeChunks.repositoryId, repositoryId));

  if (!stats) {
    throw new Error(`Unable to verify chunk embeddings for repository ${repositoryId}.`);
  }

  return stats;
}

export async function searchCodeChunksByEmbedding(
  repositoryId: string,
  embedding: number[],
  limit = 10,
) {
  if (embedding.length !== 1536 || !embedding.every((value) => Number.isFinite(value))) {
    throw new Error("Search embedding must contain exactly 1536 finite numbers.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new Error("Search result limit must be an integer between 1 and 50.");
  }

  const vectorValue = `[${embedding.join(",")}]`;
  const distance = sql<number>`${codeChunks.embedding} <=> ${vectorValue}::vector`;

  const rows = await db
    .select({
      id: codeChunks.id,
      filePath: codeChunks.filePath,
      content: codeChunks.content,
      startLine: codeChunks.startLine,
      endLine: codeChunks.endLine,
      distance,
    })
    .from(codeChunks)
    .where(and(eq(codeChunks.repositoryId, repositoryId), isNotNull(codeChunks.embedding)))
    .orderBy(asc(distance))
    .limit(limit);

  return rows.map(({ distance: cosineDistance, ...chunk }) => ({
    ...chunk,
    similarity: 1 - cosineDistance,
  }));
}

export async function searchCodeChunksByText(repositoryId: string, terms: string[], limit = 40) {
  const uniqueTerms = [...new Set(terms)];
  if (
    uniqueTerms.some((term) => !/^[a-z0-9]+$/i.test(term)) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error("Text search terms or result limit are invalid.");
  }
  if (uniqueTerms.length === 0) {
    return [];
  }

  const searchQuery = uniqueTerms.map((term) => `${term}:*`).join(" | ");
  const document = sql`to_tsvector('simple', regexp_replace(${codeChunks.filePath}, '[/._-]+', ' ', 'g') || ' ' || ${codeChunks.content})`;
  const query = sql`to_tsquery('simple', ${searchQuery})`;
  const score = sql<number>`ts_rank_cd(${document}, ${query})`;

  return db
    .select({
      id: codeChunks.id,
      filePath: codeChunks.filePath,
      content: codeChunks.content,
      startLine: codeChunks.startLine,
      endLine: codeChunks.endLine,
      keywordScore: score,
    })
    .from(codeChunks)
    .where(
      and(
        eq(codeChunks.repositoryId, repositoryId),
        isNotNull(codeChunks.embedding),
        sql`${document} @@ ${query}`,
      ),
    )
    .orderBy(desc(score))
    .limit(limit);
}

export async function updateMissingChunkEmbeddings(
  repositoryId: string,
  chunks: { id: string; embedding: number[] }[],
) {
  if (chunks.length === 0) {
    return 0;
  }

  const values = chunks.map(
    ({ id, embedding }) => sql`(${id}::uuid, ${`[${embedding.join(",")}]`}::vector)`,
  );
  const updated = await db.execute(sql`
    UPDATE code_chunks AS chunk
    SET embedding = values_to_update.embedding
    FROM (VALUES ${sql.join(values, sql`, `)}) AS values_to_update(id, embedding)
    WHERE chunk.id = values_to_update.id
      AND chunk.repository_id = ${repositoryId}
      AND chunk.embedding IS NULL
    RETURNING chunk.id
  `);

  return updated.length;
}

export async function getCodeChunkById(id: string) {
  return db.query.codeChunks.findFirst({
    where: eq(codeChunks.id, id),
  });
}

export async function getChunksByRepository(repositoryId: string) {
  return db.query.codeChunks.findMany({
    where: eq(codeChunks.repositoryId, repositoryId),
  });
}

export async function getChunksByFile(fileId: string) {
  return db.query.codeChunks.findMany({
    where: eq(codeChunks.fileId, fileId),
    orderBy: (table, { asc }) => [asc(table.startLine)],
  });
}

export async function deleteCodeChunk(id: string) {
  const [chunk] = await db.delete(codeChunks).where(eq(codeChunks.id, id)).returning();

  return chunk;
}

export async function deleteChunksByFile(fileId: string) {
  return db.delete(codeChunks).where(eq(codeChunks.fileId, fileId)).returning();
}

export async function deleteChunksByRepository(repositoryId: string) {
  return db.delete(codeChunks).where(eq(codeChunks.repositoryId, repositoryId)).returning();
}
