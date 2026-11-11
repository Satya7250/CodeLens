import type { Repository } from "@repo/db";

export type SerializedRepository = Omit<Repository, "githubRepoId"> & {
  githubRepoId: string;
};

export function serializeRepository(repo: Repository): SerializedRepository {
  return {
    ...repo,
    githubRepoId: String(repo.githubRepoId),
  };
}

export function serializeRepositories(repos: Repository[]): SerializedRepository[] {
  return repos.map(serializeRepository);
}
