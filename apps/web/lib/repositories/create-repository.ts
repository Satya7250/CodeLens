import { createRepository, getRepositoryByGithubId } from "@repo/db";
import type { RepositoryCreate } from "@repo/types";

export async function saveRepositoryForUser(userId: string, data: RepositoryCreate) {
  const existingRepository = await getRepositoryByGithubId(userId, BigInt(data.githubRepoId));

  if (existingRepository) {
    return existingRepository;
  }

  return createRepository({
    userId,
    githubRepoId: BigInt(data.githubRepoId),
    owner: data.owner,
    name: data.name,
    defaultBranch: data.defaultBranch,
    visibility: data.visibility,
  });
}
