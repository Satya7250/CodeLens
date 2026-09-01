"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GitHubRepository = {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  private: boolean;
};

type SavedRepository = {
  id: string;
  userId: string;
  githubRepoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  visibility: "public" | "private" | "internal";
  indexStatus: "PENDING" | "INDEXING" | "INDEXED" | "FAILED";
};

async function fetchGitHubRepositories() {
  const response = await fetch("/api/github/repositories");

  if (!response.ok) {
    throw new Error("Unable to load GitHub repositories");
  }

  return response.json() as Promise<GitHubRepository[]>;
}

async function fetchSavedRepositories() {
  const response = await fetch("/api/repositories");

  if (!response.ok) {
    throw new Error("Unable to load selected repositories");
  }

  return response.json() as Promise<SavedRepository[]>;
}

async function saveRepository(repository: GitHubRepository) {
  const response = await fetch("/api/repositories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      githubRepoId: repository.id,
      owner: repository.owner,
      name: repository.name,
      defaultBranch: repository.defaultBranch,
      visibility: repository.private ? "private" : "public",
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to save repository");
  }

  return response.json();
}

export function RepositorySelector() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const githubReposQuery = useQuery({
    queryKey: ["github-repositories"],
    queryFn: fetchGitHubRepositories,
  });

  const savedReposQuery = useQuery({
    queryKey: ["saved-repositories"],
    queryFn: fetchSavedRepositories,
  });

  const saveRepositoryMutation = useMutation({
    mutationFn: saveRepository,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-repositories"] });
    },
  });

  const savedRepoIds = new Set(
    (savedReposQuery.data ?? []).map((repo) => String(repo.githubRepoId)),
  );

  const repositories = githubReposQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository selection</CardTitle>
        <CardDescription>Select the repositories you want CodeLens to work with.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {githubReposQuery.isLoading || savedReposQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading repositories...</div>
        ) : null}

        {githubReposQuery.isError ? (
          <div className="text-sm text-destructive">
            {githubReposQuery.error?.message ?? "Failed to load repositories."}
          </div>
        ) : null}

        {!githubReposQuery.isLoading && !githubReposQuery.isError && repositories.length === 0 ? (
          <div className="text-sm text-muted-foreground">No GitHub repositories found.</div>
        ) : null}

        {(savedReposQuery.data ?? []).length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Saved repositories</h3>
            {(savedReposQuery.data ?? []).map((repository) => (
              <Link
                key={repository.id}
                href={`/repository/${repository.id}`}
                className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">
                    {repository.owner}/{repository.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {repository.defaultBranch} · {repository.indexStatus}
                  </div>
                </div>
                <Badge variant="outline">Open</Badge>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Available on GitHub</h3>
          {repositories.map((repository) => {
            const isSaved = savedRepoIds.has(repository.id);
            const isSaving = savingId === repository.id && saveRepositoryMutation.isPending;

            return (
              <div
                key={repository.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{repository.fullName}</span>
                    <Badge variant={repository.private ? "secondary" : "outline"}>
                      {repository.private ? "Private" : "Public"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{repository.defaultBranch}</div>
                </div>

                <Button
                  variant={isSaved ? "secondary" : "default"}
                  size="sm"
                  disabled={isSaved || isSaving}
                  onClick={() => {
                    setSavingId(repository.id);
                    saveRepositoryMutation.mutate(repository, {
                      onSettled: () => setSavingId(null),
                    });
                  }}
                >
                  {isSaving ? "Saving..." : isSaved ? "Selected" : "Select"}
                </Button>
              </div>
            );
          })}
        </div>

        {saveRepositoryMutation.isError ? (
          <div className="text-sm text-destructive">
            {saveRepositoryMutation.error?.message ?? "Unable to save repository."}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
