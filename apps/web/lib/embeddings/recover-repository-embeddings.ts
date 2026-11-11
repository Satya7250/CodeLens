import {
  acquireRepositoryIndexLock,
  getChunksMissingEmbeddings,
  getRepositoryChunkEmbeddingStats,
  updateMissingChunkEmbeddings,
} from "@repo/db";

import { generateEmbeddings } from "@/lib/embeddings/openrouter";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";

const RECOVERY_BATCH_SIZE = 50;

export type EmbeddingRecoveryStats = {
  chunksFound: number;
  chunksEmbedded: number;
  chunksRemaining: number;
};

export async function recoverRepositoryEmbeddings(
  repositoryId: string,
  databaseUserId: string,
): Promise<EmbeddingRecoveryStats> {
  const repository = await getRepositoryForUser(repositoryId, databaseUserId);
  if (!repository) {
    throw new Error("Repository not found");
  }

  const releaseLock = await acquireRepositoryIndexLock(repositoryId);
  if (!releaseLock) {
    throw new Error("Repository indexing or embedding recovery is already in progress.");
  }

  try {
    const missingChunks = await getChunksMissingEmbeddings(repositoryId);
    let chunksEmbedded = 0;

    for (let offset = 0; offset < missingChunks.length; offset += RECOVERY_BATCH_SIZE) {
      const batch = missingChunks.slice(offset, offset + RECOVERY_BATCH_SIZE);
      const embeddings = await generateEmbeddings(
        batch.map((chunk) => chunk.content),
        RECOVERY_BATCH_SIZE,
      );
      const updates = batch.map((chunk, index) => {
        const embedding = embeddings[index];
        if (!embedding) {
          throw new Error(`Embedding generation returned no result for chunk ${chunk.id}.`);
        }
        return { id: chunk.id, embedding };
      });

      chunksEmbedded += await updateMissingChunkEmbeddings(repositoryId, updates);
    }

    const finalStats = await getRepositoryChunkEmbeddingStats(repositoryId);
    if (finalStats.missingEmbeddings !== 0 || finalStats.invalidDimensions !== 0) {
      throw new Error(
        `Embedding recovery incomplete for repository ${repositoryId}: ${finalStats.missingEmbeddings} embeddings remain missing and ${finalStats.invalidDimensions} have invalid dimensions.`,
      );
    }

    return {
      chunksFound: missingChunks.length,
      chunksEmbedded,
      chunksRemaining: finalStats.missingEmbeddings,
    };
  } finally {
    await releaseLock();
  }
}
