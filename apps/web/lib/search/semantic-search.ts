import "server-only";

import { searchCodeChunksByEmbedding, searchCodeChunksByText } from "@repo/db";

import { generateEmbeddings, getOpenRouterErrorStatus } from "@/lib/embeddings/openrouter";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";
import { executeHybridSearch } from "./hybrid-search-core";
import { rankCodeChunks } from "./rank-code-chunks";
import { SemanticSearchProviderError } from "./semantic-search-error";
import { extractIdentifierAnchors, extractSearchTerms } from "./search-terms";

const MAX_SEMANTIC_QUERY_LENGTH = 5000;
const HYBRID_CANDIDATE_LIMIT = 40;

export { SemanticSearchProviderError } from "./semantic-search-error";

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
  } catch (error) {
    const status = getOpenRouterErrorStatus(error);
    console.error("OpenRouter query embedding generation failed.", { status });
    throw new SemanticSearchProviderError(status, { cause: error });
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
  return (await hybridSearchWithMode(repositoryId, databaseUserId, query, limit)).chunks;
}

export async function hybridSearchWithMode(
  repositoryId: string,
  databaseUserId: string,
  query: string,
  limit = 8,
) {
  const normalizedQuery = normalizeQuery(query, limit);
  const terms = extractSearchTerms(normalizedQuery);
  return executeHybridSearch(
    () => getQueryEmbedding(repositoryId, databaseUserId, normalizedQuery),
    (embedding) => searchCodeChunksByEmbedding(repositoryId, embedding, HYBRID_CANDIDATE_LIMIT),
    () => searchCodeChunksByText(repositoryId, terms, HYBRID_CANDIDATE_LIMIT),
    rankCodeChunks,
    extractIdentifierAnchors(normalizedQuery),
    limit,
  );
}
