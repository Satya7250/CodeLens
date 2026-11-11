import { z } from "zod";

export const SearchChunkSchema = z
  .object({
    id: z.uuid(),
    filePath: z.string().trim().min(1),
    content: z.string(),
    startLine: z.number().int().min(1),
    endLine: z.number().int().min(1),
    similarity: z.number().finite(),
  })
  .strict();

export const RepositorySearchBodySchema = z
  .object({
    query: z.string().trim().min(1).max(1000),
    limit: z.number().int().min(1).max(50).default(10),
  })
  .strict();

export const RepositorySearchRequestSchema = z
  .object({
    repositoryId: z.uuid(),
    query: z.string().trim().min(1).max(1000),
    limit: z.number().int().min(1).max(50).default(10),
  })
  .strict();

export const RepositorySearchResponseSchema = z
  .object({
    results: z.array(SearchChunkSchema),
  })
  .strict();

export type SearchChunk = z.infer<typeof SearchChunkSchema>;
export type RepositorySearchRequest = z.infer<typeof RepositorySearchRequestSchema>;
export type RepositorySearchResponse = z.infer<typeof RepositorySearchResponseSchema>;
