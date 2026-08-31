import { getUserRepositories as fetchGithubRepositories } from "@repo/github";
import { GitHubRepositoryListSchema, type GitHubRepository } from "@repo/types";

export async function getGithubRepositoriesForCurrentUser(
  token: string,
): Promise<GitHubRepository[]> {
  const repositories = await fetchGithubRepositories(token);
  const parsed = GitHubRepositoryListSchema.safeParse(repositories);

  if (!parsed.success) {
    throw new Error("Invalid GitHub repository payload.");
  }

  return parsed.data;
}
