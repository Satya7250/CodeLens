import { getRepositoryById } from "@repo/db";

export async function getRepositoryForUser(repositoryId: string, userId: string) {
  const repository = await getRepositoryById(repositoryId);

  if (!repository || repository.userId !== userId) {
    return null;
  }

  return repository;
}
