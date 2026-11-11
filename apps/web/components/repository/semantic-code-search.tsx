"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon, FileCodeIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import { RepositorySearchResponseSchema, type SearchChunk } from "@repo/types";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

const SUGGESTED_QUERIES = [
  "Database schemas and tables",
  "Authentication and token validation",
  "API route handlers",
  "Vector embeddings generation",
];

function SearchResultItem({ result }: { result: SearchChunk }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const similarityPercentage = Math.round(result.similarity * 100);

  return (
    <li className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:border-primary/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-mono font-medium text-foreground truncate max-w-full sm:max-w-md">
          <FileCodeIcon className="size-3.5 text-primary shrink-0" />
          <span className="truncate">{result.filePath}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">
            Lines {result.startLine}–{result.endLine}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] font-normal ${
              similarityPercentage >= 80
                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
            }`}
          >
            {similarityPercentage}% match
          </Badge>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy snippet"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-emerald-500" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      <pre className="max-h-72 overflow-x-auto bg-zinc-950 p-3.5 text-xs font-mono text-zinc-100 dark:bg-zinc-900/90 leading-relaxed">
        <code>{result.content}</code>
      </pre>
    </li>
  );
}

export function SemanticCodeSearch({ repositoryId }: { repositoryId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchChunk[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (isPending || !trimmed) {
      return;
    }

    setIsPending(true);
    setResults(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to search this repository.";
        throw new Error(message);
      }

      const parsedResponse = RepositorySearchResponseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        throw new Error("The search service returned an unexpected response.");
      }
      setResults(parsedResponse.data.results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to search this repository.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    performSearch(query);
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <SearchIcon className="size-5 text-primary" />
            Semantic Code Search
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Find relevant functions, classes, and logic across the entire repository using natural
            language.
          </CardDescription>
        </div>

        {results && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setResults(null);
              setQuery("");
            }}
            className="self-start sm:self-auto text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcwIcon className="size-3.5" />
            Clear
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search concept in code... (e.g. Where is user authentication handled?)"
            aria-label="Search this repository"
            maxLength={1000}
            disabled={isPending}
            className="h-10 text-sm flex-1"
          />
          <Button
            type="submit"
            disabled={isPending || !query.trim()}
            className="h-10 px-5 gap-1.5 shadow-sm"
          >
            {isPending ? <Spinner /> : <SearchIcon className="size-4" />}
            <span>{isPending ? "Searching..." : "Search"}</span>
          </Button>
        </form>

        {/* Suggestion pills */}
        {!results && !isPending && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-medium text-muted-foreground">Try searching for:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUERIES.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => {
                    setQuery(sq);
                    performSearch(sq);
                  }}
                  className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {results?.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-xs sm:text-sm text-muted-foreground">
            No matching code chunks found. Ensure the repository has been indexed.
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Found {results.length} relevant code chunks</span>
              <span>Sorted by cosine vector similarity</span>
            </div>
            <ul className="space-y-3">
              {results.map((result) => (
                <SearchResultItem key={result.id} result={result} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
