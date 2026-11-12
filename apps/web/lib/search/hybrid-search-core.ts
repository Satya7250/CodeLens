import type { RankedCodeChunk } from "./rank-code-chunks";

export class SemanticSearchProviderError extends Error {
  readonly status?: number;

  constructor(status?: number, options?: ErrorOptions) {
    super(
      status === 401
        ? "OpenRouter rejected the API key. Update OPENROUTER_API_KEY in apps/web/.env.local and restart the app."
        : status === 403
          ? "OpenRouter denied access to the embedding model. Check model access for your API key."
          : "Unable to generate a search embedding. Please try again later.",
      options,
    );
    this.name = "SemanticSearchProviderError";
    this.status = status;
  }
}

type KeywordCandidate = Omit<RankedCodeChunk, "similarity"> & { keywordScore: number };

export type HybridSearchMode = "hybrid" | "keyword";

function containsAllAnchors(
  chunks: Array<Pick<RankedCodeChunk, "filePath" | "content">>,
  anchors: string[],
): boolean {
  return anchors.every((anchor) =>
    chunks.some(
      (chunk) =>
        chunk.filePath.toLowerCase().includes(anchor) ||
        chunk.content.toLowerCase().includes(anchor),
    ),
  );
}

export async function executeHybridSearch(
  getEmbedding: () => Promise<number[]>,
  searchSemantic: (embedding: number[]) => Promise<RankedCodeChunk[]>,
  searchKeyword: () => Promise<KeywordCandidate[]>,
  rank: (
    semanticChunks: RankedCodeChunk[],
    keywordChunks: KeywordCandidate[],
    limit: number,
  ) => RankedCodeChunk[],
  anchors: string[],
  limit: number,
): Promise<{ chunks: RankedCodeChunk[]; searchMode: HybridSearchMode }> {
  let embedding: number[];
  try {
    embedding = await getEmbedding();
  } catch (error) {
    if (!(error instanceof SemanticSearchProviderError)) {
      throw error;
    }
    if (error.status === 401 || error.status === 403) {
      throw error;
    }

    const keywordChunks = await searchKeyword();
    const chunks = containsAllAnchors(keywordChunks, anchors) ? rank([], keywordChunks, limit) : [];
    return { chunks, searchMode: "keyword" };
  }

  const [semanticChunks, keywordChunks] = await Promise.all([
    searchSemantic(embedding),
    searchKeyword(),
  ]);
  if (!containsAllAnchors([...semanticChunks, ...keywordChunks], anchors)) {
    return { chunks: [], searchMode: "hybrid" };
  }

  return {
    chunks: rank(semanticChunks, keywordChunks, limit),
    searchMode: "hybrid",
  };
}
