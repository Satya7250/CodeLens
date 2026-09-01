import { clerkClient } from "@clerk/nextjs/server";

import { chunkFile, shouldIndexFile } from "@repo/code-parser";
import { getRepositoryFileContent, getRepositoryTree } from "@repo/github";
import {
  createRepositoryFiles,
  createCodeChunks,
  deleteRepositoryFiles,
  deleteChunksByRepository,
} from "@repo/db";
import {
  updateRepositoryIndexStatus,
  updateLastIndexedCommit,
} from "@repo/db";

import { getRepositoryForUser } from "@/lib/repositories/get-repository";

export type RepositoryIndexingStats = {
  filesScanned: number;
  filesIndexed: number;
  chunksCreated: number;
};

function detectLanguageFromPath(path: string): string | null {
  const extension = path.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    py: "Python",
    go: "Go",
    java: "Java",
    rs: "Rust",
    md: "Markdown",
    json: "JSON",
    yml: "YAML",
    yaml: "YAML",
  };

  return languageMap[extension || ""] || null;
}

export async function startIndexing(
  repositoryId: string,
  databaseUserId: string,
  clerkUserId: string,
): Promise<RepositoryIndexingStats> {
  const repository = await getRepositoryForUser(repositoryId, databaseUserId);

  if (!repository) {
    throw new Error("Repository not found");
  }

  // Update status to INDEXING
  await updateRepositoryIndexStatus(repositoryId, "INDEXING");

  try {
    const client = await clerkClient();
    const oauthTokens = await client.users.getUserOauthAccessToken(clerkUserId, "github");

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

    // Get the current commit SHA from the branch
    const treeCommitSha = tree[0]?.sha || repository.defaultBranch;

    // Clear old data
    await deleteChunksByRepository(repositoryId);
    await deleteRepositoryFiles(repositoryId);

    const candidateEntries = tree.filter((entry) => entry.type === "blob");
    const indexableEntries = candidateEntries.filter((entry) => shouldIndexFile(entry.path));

    // Step 1: Create repository_files entries and fetch content
    const filesToIndex: Array<{
      path: string;
      sha: string;
      content: string;
      language: string | null;
    }> = [];

    for (const entry of indexableEntries) {
      const content = await getRepositoryFileContent(
        githubToken,
        repository.owner,
        repository.name,
        entry.path,
      );

      if (content) {
        filesToIndex.push({
          path: entry.path,
          sha: entry.sha,
          content,
          language: detectLanguageFromPath(entry.path),
        });
      }
    }

    // Batch create repository files
    const fileRecords = await createRepositoryFiles(
      filesToIndex.map((file) => ({
        repositoryId,
        path: file.path,
        sha: file.sha,
        size: Buffer.byteLength(file.content, "utf8"),
        language: file.language,
      })),
    );

    // Step 2: Create code chunks
    const chunksToCreate: Array<{
      repositoryId: string;
      fileId: string;
      filePath: string;
      content: string;
      startLine: number;
      endLine: number;
    }> = [];

    for (const file of fileRecords) {
      const fileIndex = filesToIndex.findIndex((f) => f.path === file.path);
      if (fileIndex !== -1) {
        const chunks = chunkFile(filesToIndex[fileIndex]!.content, file.path);

        for (const chunk of chunks) {
          chunksToCreate.push({
            repositoryId,
            fileId: file.id,
            filePath: file.path,
            content: chunk.content,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
          });
        }
      }
    }

    // Batch create chunks
    await createCodeChunks(chunksToCreate);

    // Step 3: Update repository status
    await updateRepositoryIndexStatus(repositoryId, "INDEXED");
    await updateLastIndexedCommit(repositoryId, treeCommitSha);

    return {
      filesScanned: candidateEntries.length,
      filesIndexed: fileRecords.length,
      chunksCreated: chunksToCreate.length,
    };
  } catch (error) {
    // Update status to FAILED on error
    await updateRepositoryIndexStatus(repositoryId, "FAILED");
    throw error;
  }
}
