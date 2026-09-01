import { z } from "zod";

import { RepositoryIndexStatusSchema } from "./repository";

export const IndexRepositoryRequestSchema = z
  .object({
    repositoryId: z.uuid(),
  })
  .strict();

export const IndexRepositoryResponseSchema = z
  .object({
    success: z.boolean(),
    status: RepositoryIndexStatusSchema,
  })
  .strict();

export const RepositoryIndexStatusResponseSchema = z
  .object({
    repositoryId: z.uuid(),
    status: RepositoryIndexStatusSchema,
    lastIndexedAt: z.iso.datetime().nullable(),
  })
  .strict();

export type IndexRepositoryRequest = z.infer<typeof IndexRepositoryRequestSchema>;
export type IndexRepositoryResponse = z.infer<typeof IndexRepositoryResponseSchema>;
export type RepositoryIndexStatusResponse = z.infer<typeof RepositoryIndexStatusResponseSchema>;
