import { startIndexing } from "@/lib/indexing/start-indexing";

import { getRepositoryForUser } from "./get-repository";

export async function indexRepositoryForUser(repositoryId: string, userId: string) {
  const repository = await getRepositoryForUser(repositoryId, userId);

  if (!repository) {
    return null;
  }

  return startIndexing(repositoryId, userId);
}
