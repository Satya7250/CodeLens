import { z } from "zod";

export const GitHubRepositorySchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    fullName: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    defaultBranch: z.string().trim().min(1),
    private: z.boolean(),
  })
  .strict();

export const GitHubRepositoryListSchema = z.array(GitHubRepositorySchema);

export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>;
export type GitHubRepositoryList = z.infer<typeof GitHubRepositoryListSchema>;
