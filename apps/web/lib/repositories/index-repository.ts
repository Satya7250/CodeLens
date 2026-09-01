import { startIndexing } from "@/lib/indexing/start-indexing";

import { getRepositoryForUser } from "./get-repository";

export async function indexRepositoryForUser(
  repositoryId: string,
  databaseUserId: string,
  clerkUserId: string,
) {
  const repository = await getRepositoryForUser(repositoryId, databaseUserId);

  if (!repository) {
    return null;
  }

  return startIndexing(repositoryId, databaseUserId, clerkUserId);
}
