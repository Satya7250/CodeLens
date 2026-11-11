const SEARCH_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "api",
  "application",
  "are",
  "as",
  "at",
  "backend",
  "be",
  "by",
  "code",
  "complete",
  "do",
  "does",
  "explain",
  "file",
  "files",
  "for",
  "frontend",
  "from",
  "how",
  "in",
  "internally",
  "is",
  "it",
  "implement",
  "implemented",
  "implementation",
  "of",
  "on",
  "or",
  "process",
  "prevent",
  "repository",
  "the",
  "this",
  "to",
  "which",
  "where",
  "with",
  "communicate",
  "communication",
  "work",
  "works",
]);

const SEARCH_TERM_ALIASES: Record<string, string> = {
  authenticate: "auth",
  authentication: "auth",
  authorization: "auth",
  communicates: "communicate",
  communication: "communicate",
  repositories: "repository",
};

export function extractSearchTerms(query: string): string[] {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [
    ...new Set(
      terms
        .filter((term) => term.length > 2 && !SEARCH_STOP_WORDS.has(term))
        .map((term) => SEARCH_TERM_ALIASES[term] ?? term)
        .filter((term) => !SEARCH_STOP_WORDS.has(term))
        .filter((term) => /^[a-z0-9]+$/.test(term)),
    ),
  ].slice(0, 12);
}

export function extractIdentifierAnchors(query: string): string[] {
  const identifiers = query.match(/\b[A-Z][a-z0-9]*[A-Z][A-Za-z0-9]*\b/g) ?? [];
  return [
    ...new Set(
      identifiers
        .map((identifier) => identifier.toLowerCase())
        .filter((identifier) => !SEARCH_STOP_WORDS.has(identifier)),
    ),
  ];
}
