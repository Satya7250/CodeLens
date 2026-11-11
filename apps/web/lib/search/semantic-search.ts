import "server-only";

import { searchCodeChunksByEmbedding, searchCodeChunksByText } from "@repo/db";

import { generateEmbeddings } from "@/lib/embeddings/openrouter";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";
import { rankCodeChunks } from "./rank-code-chunks";
import { extractIdentifierAnchors, extractSearchTerms } from "./search-terms";

const MAX_SEMANTIC_QUERY_LENGTH = 5000;
const HYBRID_CANDIDATE_LIMIT = 40;

export class SemanticSearchProviderError extends Error {
  constructor() {
    super("Unable to generate a search embedding. Please try again later.");
    this.name = "SemanticSearchProviderError";
  }
}

function normalizeQuery(query: string, limit: number): string {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("Search query must not be empty.");
  }
  if (normalizedQuery.length > MAX_SEMANTIC_QUERY_LENGTH) {
    throw new Error(`Search query must be ${MAX_SEMANTIC_QUERY_LENGTH} characters or fewer.`);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new Error("Search result limit must be an integer between 1 and 50.");
  }
  return normalizedQuery;
}

async function getQueryEmbedding(repositoryId: string, databaseUserId: string, query: string) {
  const repository = await getRepositoryForUser(repositoryId, databaseUserId);
  if (!repository) {
    throw new Error("Repository not found");
  }

  try {
    const [embedding] = await generateEmbeddings([query]);
    if (!embedding) {
      throw new Error("Embedding generation returned no result.");
    }
    return embedding;
  } catch {
    throw new SemanticSearchProviderError();
  }
}

export async function semanticSearch(
  repositoryId: string,
  databaseUserId: string,
  query: string,
  limit = 10,
) {
  const normalizedQuery = normalizeQuery(query, limit);
  const embedding = await getQueryEmbedding(repositoryId, databaseUserId, normalizedQuery);
  return searchCodeChunksByEmbedding(repositoryId, embedding, limit);
}

export async function hybridSearch(
  repositoryId: string,
  databaseUserId: string,
  query: string,
  limit = 8,
) {
  const normalizedQuery = normalizeQuery(query, limit);
  const embedding = await getQueryEmbedding(repositoryId, databaseUserId, normalizedQuery);
  const terms = extractSearchTerms(normalizedQuery);

  const [semanticChunks, keywordChunks] = await Promise.all([
    searchCodeChunksByEmbedding(repositoryId, embedding, HYBRID_CANDIDATE_LIMIT),
    searchCodeChunksByText(repositoryId, terms, HYBRID_CANDIDATE_LIMIT),
  ]);

  const identifierAnchors = extractIdentifierAnchors(normalizedQuery);
  if (
    identifierAnchors.some(
      (anchor) =>
        ![...semanticChunks, ...keywordChunks].some(
          (chunk) =>
            chunk.filePath.toLowerCase().includes(anchor) ||
            chunk.content.toLowerCase().includes(anchor),
        ),
    )
  ) {
    return [];
  }

  return rankCodeChunks(semanticChunks, keywordChunks, limit);
}
