import assert from "node:assert/strict";
import test from "node:test";

import { executeHybridSearch } from "./hybrid-search-core.ts";
import { SemanticSearchProviderError } from "./hybrid-search-core.ts";
import { rankCodeChunks } from "./rank-code-chunks.ts";

const keywordChunks = [
  {
    id: "chunk-keyword",
    filePath: "src/auth.ts",
    content: "function verifySession() {}",
    startLine: 3,
    endLine: 3,
    keywordScore: 0.8,
  },
];

test("uses keyword-only retrieval when the embedding provider fails", async () => {
  let semanticSearchCalled = false;
  const result = await executeHybridSearch(
    async () => {
      throw new SemanticSearchProviderError();
    },
    async () => {
      semanticSearchCalled = true;
      return [];
    },
    async () => keywordChunks,
    rankCodeChunks,
    ["verifysession"],
    8,
  );

  assert.equal(semanticSearchCalled, false);
  assert.equal(result.searchMode, "keyword");
  assert.deepEqual(
    result.chunks.map(({ id }) => id),
    ["chunk-keyword"],
  );
});

test("does not suppress authorization or database failures", async () => {
  const databaseError = new Error("Database unavailable");
  let keywordSearchCalled = false;

  await assert.rejects(
    executeHybridSearch(
      async () => {
        throw databaseError;
      },
      async () => [],
      rankCodeChunks,
      async () => {
        keywordSearchCalled = true;
        return keywordChunks;
      },
      [],
      8,
    ),
    databaseError,
  );
  assert.equal(keywordSearchCalled, false);
});

test("does not use keyword fallback when OpenRouter rejects its API key", async () => {
  let keywordSearchCalled = false;
  const providerError = new SemanticSearchProviderError(401);

  await assert.rejects(
    executeHybridSearch(
      async () => {
        throw providerError;
      },
      async () => [],
      async () => {
        keywordSearchCalled = true;
        return keywordChunks;
      },
      rankCodeChunks,
      [],
      8,
    ),
    (error) => error === providerError,
  );
  assert.equal(keywordSearchCalled, false);
});

test("uses and merges semantic and keyword results when embedding succeeds", async () => {
  const semanticChunks = [
    {
      id: "chunk-semantic",
      filePath: "src/session.ts",
      content: "async function loadSession() {}",
      startLine: 1,
      endLine: 1,
      similarity: 0.9,
    },
  ];

  const result = await executeHybridSearch(
    async () => [0.2],
    async () => semanticChunks,
    async () => keywordChunks,
    rankCodeChunks,
    [],
    8,
  );

  assert.equal(result.searchMode, "hybrid");
  assert.deepEqual(
    new Set(result.chunks.map(({ id }) => id)),
    new Set(["chunk-semantic", "chunk-keyword"]),
  );
});
