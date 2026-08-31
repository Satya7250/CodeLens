import { getUserRepositories as getStoredRepositories } from "@repo/db";

export async function getSavedRepositoriesForUser(userId: string) {
  return getStoredRepositories(userId);
}
