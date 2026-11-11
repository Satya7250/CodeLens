export type RankedCodeChunk = {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  similarity: number;
};

const RECIPROCAL_RANK_CONSTANT = 10;
const KEYWORD_RANK_WEIGHT = 0.6;
const MAX_CHUNKS_PER_FILE = 2;
const NEAR_DUPLICATE_THRESHOLD = 0.92;

function normalizedContent(content: string): string {
  return content.toLowerCase().replace(/\s+/g, " ").trim();
}

function contentTerms(content: string): Set<string> {
  return new Set(content.toLowerCase().match(/[a-z0-9_]+/g) ?? []);
}

function isNearDuplicate(first: Set<string>, second: Set<string>): boolean {
  if (first.size === 0 || second.size === 0) {
    return first.size === second.size;
  }

  let sharedTerms = 0;
  for (const term of first) {
    if (second.has(term)) {
      sharedTerms += 1;
    }
  }

  return sharedTerms / Math.min(first.size, second.size) >= NEAR_DUPLICATE_THRESHOLD;
}

export function rankCodeChunks(
  semanticChunks: RankedCodeChunk[],
  keywordChunks: Array<Omit<RankedCodeChunk, "similarity"> & { keywordScore: number }>,
  limit: number,
): RankedCodeChunk[] {
  const candidates = new Map<
    string,
    {
      chunk: RankedCodeChunk;
      semanticRank: number | null;
      keywordRank: number | null;
      keywordScore: number;
    }
  >();

  semanticChunks.forEach((chunk, index) => {
    candidates.set(chunk.id, {
      chunk,
      semanticRank: index + 1,
      keywordRank: null,
      keywordScore: 0,
    });
  });

  keywordChunks.forEach(({ keywordScore, ...chunk }, index) => {
    const candidate = candidates.get(chunk.id);
    if (candidate) {
      candidate.keywordRank = index + 1;
      candidate.keywordScore = keywordScore;
      return;
    }

    candidates.set(chunk.id, {
      chunk: { ...chunk, similarity: 0 },
      semanticRank: null,
      keywordRank: index + 1,
      keywordScore,
    });
  });

  const ranked = [...candidates.values()]
    .map(({ chunk, semanticRank, keywordRank, keywordScore }) => ({
      chunk,
      keywordScore,
      score:
        (semanticRank ? 1 / (RECIPROCAL_RANK_CONSTANT + semanticRank) : 0) +
        (keywordRank ? KEYWORD_RANK_WEIGHT / (RECIPROCAL_RANK_CONSTANT + keywordRank) : 0),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.keywordScore - first.keywordScore ||
        second.chunk.similarity - first.chunk.similarity,
    );

  const selected: RankedCodeChunk[] = [];
  const selectedTerms: Set<string>[] = [];
  const seenContents = new Set<string>();
  const chunksPerFile = new Map<string, number>();

  for (const { chunk } of ranked) {
    const normalized = normalizedContent(chunk.content);
    if (seenContents.has(normalized)) {
      continue;
    }

    const terms = contentTerms(chunk.content);
    if (selectedTerms.some((existing) => isNearDuplicate(existing, terms))) {
      continue;
    }

    const fileCount = chunksPerFile.get(chunk.filePath) ?? 0;
    if (fileCount >= MAX_CHUNKS_PER_FILE) {
      continue;
    }

    selected.push(chunk);
    selectedTerms.push(terms);
    seenContents.add(normalized);
    chunksPerFile.set(chunk.filePath, fileCount + 1);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}
