import { auth, clerkClient } from "@clerk/nextjs/server";

import { chunkFile, shouldIndexFile } from "@repo/code-parser";
import { getRepositoryFileContent, getRepositoryTree } from "@repo/github";

import { getRepositoryForUser } from "@/lib/repositories/get-repository";

export type RepositoryIndexingStats = {
  filesScanned: number;
  filesIndexed: number;
  chunksCreated: number;
};

export async function startIndexing(
  repositoryId: string,
  userIdOverride?: string,
): Promise<RepositoryIndexingStats> {
  const { userId: authenticatedUserId } = await auth();
  const resolvedUserId = userIdOverride ?? authenticatedUserId;

  if (!resolvedUserId) {
    throw new Error("Unauthorized");
  }

  const repository = await getRepositoryForUser(repositoryId, resolvedUserId);

  if (!repository) {
    throw new Error("Repository not found");
  }

  const client = await clerkClient();
  const oauthTokens = await client.users.getUserOauthAccessToken(resolvedUserId, "github");

  if (!oauthTokens.data.length) {
    throw new Error("GitHub account is not connected to this user.");
  }

  const githubToken = oauthTokens.data[0]?.token;

  if (!githubToken) {
    throw new Error("GitHub access token could not be retrieved.");
  }

  const tree = await getRepositoryTree(
    githubToken,
    repository.owner,
    repository.name,
    repository.defaultBranch,
  );

  const candidatePaths = tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => entry.path)
    .filter((path): path is string => Boolean(path));

  const indexablePaths = candidatePaths.filter((path) => shouldIndexFile(path));
  let chunksCreated = 0;

  for (const filePath of indexablePaths) {
    const content = await getRepositoryFileContent(
      githubToken,
      repository.owner,
      repository.name,
      filePath,
    );

    if (!content) {
      continue;
    }

    chunksCreated += chunkFile(content, filePath).length;
  }

  return {
    filesScanned: candidatePaths.length,
    filesIndexed: indexablePaths.length,
    chunksCreated,
  };
}
