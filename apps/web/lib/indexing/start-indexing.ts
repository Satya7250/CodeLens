import { clerkClient } from "@clerk/nextjs/server";

import { chunkFile, shouldIndexFile } from "@repo/code-parser";
import { getRepositoryFileContent, getRepositoryTreeWithCommit } from "@repo/github";
import {
  createRepositoryFiles,
  createCodeChunks,
  deleteRepositoryFiles,
  deleteChunksByRepository,
  acquireRepositoryIndexLock,
  updateRepositoryIndexStatus,
  completeRepositoryIndexing,
  getRepositoryChunkEmbeddingStats,
} from "@repo/db";

import { generateEmbeddings } from "@/lib/embeddings/openrouter";
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
  let releaseLock: (() => Promise<void>) | null = null;
  let indexingStarted = false;

  try {
    const repository = await getRepositoryForUser(repositoryId, databaseUserId);

    if (!repository) {
      throw new Error("Repository not found");
    }

    releaseLock = await acquireRepositoryIndexLock(repositoryId);

    if (!releaseLock) {
      throw new Error("Repository indexing is already in progress.");
    }

    indexingStarted = true;
    await updateRepositoryIndexStatus(repositoryId, databaseUserId, "INDEXING");

    const client = await clerkClient();
    const oauthTokens = await client.users.getUserOauthAccessToken(clerkUserId, "github");

    if (!oauthTokens.data.length) {
      throw new Error("GitHub account is not connected to this user.");
    }

    const githubToken = oauthTokens.data[0]?.token;

    if (!githubToken) {
      throw new Error("GitHub access token could not be retrieved.");
    }

    const { entries: tree, commitSha } = await getRepositoryTreeWithCommit(
      githubToken,
      repository.owner,
      repository.name,
      repository.defaultBranch,
    );

    const candidateEntries = tree.filter((entry) => entry.type === "blob");
    const indexableEntries = candidateEntries.filter((entry) => shouldIndexFile(entry.path));

    // Step 1: Fetch supported file contents
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

    // Step 2: Create chunks and embeddings before replacing the current index.
    const chunksToEmbed: Array<{
      repositoryId: string;
      filePath: string;
      content: string;
      startLine: number;
      endLine: number;
    }> = [];

    for (const file of filesToIndex) {
      const chunks = chunkFile(file.content, file.path);

      for (const chunk of chunks) {
        chunksToEmbed.push({
          repositoryId,
          filePath: file.path,
          content: chunk.content,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
        });
      }
    }

    const embeddings = await generateEmbeddings(chunksToEmbed.map((chunk) => chunk.content));
    const chunksWithEmbeddings = chunksToEmbed.map((chunk, index) => {
      const embedding = embeddings[index];
      if (!embedding) {
        throw new Error(`Embedding generation returned no result for chunk ${index + 1}.`);
      }
      return { ...chunk, embedding };
    });

    // Replace the previous index only after fetching and embedding the new content succeeds.
    await deleteChunksByRepository(repositoryId);
    await deleteRepositoryFiles(repositoryId);

    const fileRecords = await createRepositoryFiles(
      filesToIndex.map((file) => ({
        repositoryId,
        path: file.path,
        sha: file.sha,
        size: Buffer.byteLength(file.content, "utf8"),
        language: file.language,
      })),
    );
    const fileIdByPath = new Map(fileRecords.map((file) => [file.path, file.id]));
    const chunksToCreate = chunksWithEmbeddings.map((chunk) => {
      const fileId = fileIdByPath.get(chunk.filePath);
      if (!fileId) {
        throw new Error(`Unable to find the stored repository file for ${chunk.filePath}.`);
      }
      return { ...chunk, fileId };
    });

    await createCodeChunks(chunksToCreate);

    const embeddingStats = await getRepositoryChunkEmbeddingStats(repositoryId);
    if (
      embeddingStats.totalChunks !== chunksToCreate.length ||
      embeddingStats.missingEmbeddings !== 0 ||
      embeddingStats.invalidDimensions !== 0
    ) {
      throw new Error(
        `Index validation failed for repository ${repositoryId}: expected ${chunksToCreate.length} chunks with valid 1536-dimensional embeddings, found ${embeddingStats.totalChunks} chunks, ${embeddingStats.missingEmbeddings} missing embeddings, and ${embeddingStats.invalidDimensions} invalid dimensions.`,
      );
    }

    // Step 3: Update repository status
    await completeRepositoryIndexing(repositoryId, databaseUserId, commitSha);

    return {
      filesScanned: candidateEntries.length,
      filesIndexed: fileRecords.length,
      chunksCreated: chunksToCreate.length,
    };
  } catch (error) {
    if (indexingStarted) {
      try {
        await updateRepositoryIndexStatus(repositoryId, databaseUserId, "FAILED");
      } catch (statusError) {
        console.error("Unable to persist FAILED indexing status:", statusError);
      }
    }

    throw error;
  } finally {
    if (releaseLock) {
      try {
        await releaseLock();
      } catch (releaseError) {
        console.error("Unable to release repository indexing lock:", releaseError);
      }
    }
  }
}
