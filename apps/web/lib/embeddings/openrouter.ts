import "server-only";

import OpenAI from "openai";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_EMBEDDING_BATCH_SIZE = 50;

export function getOpenRouterErrorStatus(error: unknown): number | undefined {
  const seen = new Set<object>();
  let current = error;

  while (typeof current === "object" && current !== null && !seen.has(current)) {
    seen.add(current);
    if ("status" in current && typeof current.status === "number") {
      return current.status;
    }
    current = "cause" in current ? current.cause : undefined;
  }

  return undefined;
}

export function createOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey?.trim()) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Add it to the server environment to enable OpenRouter requests.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
  });
}

async function embedBatch(client: OpenAI, texts: string[]): Promise<number[][]> {
  let response: Awaited<ReturnType<OpenAI["embeddings"]["create"]>>;

  try {
    response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? ` (HTTP ${error.status})` : "";
    throw new Error(
      `OpenRouter embedding request failed${status}. Check OPENROUTER_API_KEY, provider availability, account limits, and rate limits.`,
      { cause: error },
    );
  }

  if (!Array.isArray(response.data) || response.data.length !== texts.length) {
    throw new Error("OpenRouter returned an empty or incomplete embedding response.");
  }

  const embeddings: Array<number[] | undefined> = new Array(texts.length);

  for (const result of response.data) {
    if (!result || typeof result !== "object") {
      throw new Error("OpenRouter returned a malformed embedding response.");
    }

    if (
      !Number.isInteger(result.index) ||
      result.index < 0 ||
      result.index >= texts.length ||
      embeddings[result.index] !== undefined
    ) {
      throw new Error("OpenRouter returned a malformed embedding response with invalid indexes.");
    }

    if (
      !Array.isArray(result.embedding) ||
      result.embedding.length !== EMBEDDING_DIMENSIONS ||
      !result.embedding.every((value) => typeof value === "number" && Number.isFinite(value))
    ) {
      throw new Error(
        `OpenRouter returned an invalid embedding. Expected ${EMBEDDING_DIMENSIONS} finite numbers.`,
      );
    }

    embeddings[result.index] = result.embedding;
  }

  return Array.from({ length: texts.length }, (_, index) => {
    const embedding = embeddings[index];
    if (!embedding) {
      throw new Error("OpenRouter returned a malformed embedding response with missing indexes.");
    }
    return embedding;
  });
}

export async function generateEmbeddings(
  texts: readonly string[],
  batchSize = DEFAULT_EMBEDDING_BATCH_SIZE,
): Promise<number[][]> {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("Embedding batch size must be a positive integer.");
  }

  if (texts.length === 0) {
    return [];
  }

  const client = createOpenRouterClient();
  const embeddings: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += batchSize) {
    const batch = texts.slice(offset, offset + batchSize);
    embeddings.push(...(await embedBatch(client, batch)));
  }

  return embeddings;
}
