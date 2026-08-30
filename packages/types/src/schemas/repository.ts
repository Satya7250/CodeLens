import { z } from "zod";

export const RepositoryVisibilitySchema = z.enum(["public", "private", "internal"]);

export const RepositoryIndexStatusSchema = z.enum(["PENDING", "INDEXING", "INDEXED", "FAILED"]);

export const RepositorySchema = z
  .object({
    id: z.uuid(),
    githubRepoId: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    name: z.string().trim().min(1),
    defaultBranch: z.string().trim().min(1),
    visibility: RepositoryVisibilitySchema,
    indexStatus: RepositoryIndexStatusSchema,
  })
  .strict();

export const RepositoryCreateSchema = z
  .object({
    githubRepoId: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    name: z.string().trim().min(1),
    defaultBranch: z.string().trim().min(1),
    visibility: RepositoryVisibilitySchema,
  })
  .strict();

export type RepositoryVisibility = z.infer<typeof RepositoryVisibilitySchema>;
export type RepositoryIndexStatus = z.infer<typeof RepositoryIndexStatusSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type RepositoryCreate = z.infer<typeof RepositoryCreateSchema>;
