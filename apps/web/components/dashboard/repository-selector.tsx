"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  CheckIcon,
  FolderGit2Icon,
  GitBranchIcon,
  MessagesSquareIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import type { SerializedRepository } from "@/lib/repositories/serialize";

type GitHubRepository = {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  private: boolean;
};

async function fetchGitHubRepositories(): Promise<GitHubRepository[]> {
  const response = await fetch("/api/github/repositories");
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Unable to load GitHub repositories");
  }
  return response.json();
}

async function fetchSavedRepositories(): Promise<SerializedRepository[]> {
  const response = await fetch("/api/repositories");
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Unable to load saved repositories");
  }
  return response.json();
}

async function saveRepository(repository: GitHubRepository) {
  const response = await fetch("/api/repositories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      githubRepoId: String(repository.id),
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

async function deleteRepository(repositoryId: string) {
  const response = await fetch(`/api/repositories/${repositoryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to delete repository");
  }

  return response.json();
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          Ready
        </Badge>
      );
    case "INDEXING":
      return (
        <Badge
          variant="outline"
          className="animate-pulse border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
        >
          Indexing...
        </Badge>
      );
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return (
        <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
          Pending
        </Badge>
      );
  }
}

export function RepositorySelector() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("connected");

  const githubReposQuery = useQuery({
    queryKey: ["github-repositories"],
    queryFn: fetchGitHubRepositories,
    retry: 1,
  });

  const savedReposQuery = useQuery({
    queryKey: ["saved-repositories"],
    queryFn: fetchSavedRepositories,
  });

  const saveRepositoryMutation = useMutation({
    mutationFn: saveRepository,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["saved-repositories"] });
      toast.success(`Connected ${data.owner}/${data.name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteRepositoryMutation = useMutation({
    mutationFn: deleteRepository,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-repositories"] });
      toast.success("Repository disconnected successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rawSavedRepos = savedReposQuery.data;
  const rawGithubRepos = githubReposQuery.data;

  const savedRepos = useMemo(() => rawSavedRepos ?? [], [rawSavedRepos]);
  const githubRepos = useMemo(() => rawGithubRepos ?? [], [rawGithubRepos]);

  const savedRepoGithubIds = useMemo(
    () => new Set(savedRepos.map((repo) => String(repo.githubRepoId))),
    [savedRepos],
  );

  const filteredSavedRepos = useMemo(() => {
    if (!searchQuery.trim()) return savedRepos;
    const q = searchQuery.toLowerCase();
    return savedRepos.filter(
      (r) => r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q),
    );
  }, [savedRepos, searchQuery]);

  const filteredGithubRepos = useMemo(() => {
    if (!searchQuery.trim()) return githubRepos;
    const q = searchQuery.toLowerCase();
    return githubRepos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q),
    );
  }, [githubRepos, searchQuery]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Repositories</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Connect and manage repositories indexed for CodeLens AI chat and search.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              githubReposQuery.refetch();
              savedReposQuery.refetch();
              toast.info("Refreshed repository lists");
            }}
            disabled={githubReposQuery.isFetching || savedReposQuery.isFetching}
            className="self-start sm:self-auto gap-1.5 text-xs"
          >
            <RefreshCwIcon
              className={`size-3.5 ${
                githubReposQuery.isFetching || savedReposQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Sync
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter repositories by name or owner..."
            className="pl-9 h-10 text-sm"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as string)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
            <TabsTrigger value="connected" className="text-xs sm:text-sm">
              Connected ({savedRepos.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs sm:text-sm">
              GitHub Available ({githubRepos.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CONNECTED REPOSITORIES */}
          <TabsContent value="connected" className="space-y-3 focus-visible:outline-none">
            {savedReposQuery.isLoading ? (
              <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
                <Spinner />
                Loading connected repositories...
              </div>
            ) : null}

            {savedReposQuery.isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {savedReposQuery.error?.message ?? "Failed to load saved repositories."}
              </div>
            ) : null}

            {!savedReposQuery.isLoading &&
            !savedReposQuery.isError &&
            filteredSavedRepos.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <FolderGit2Icon className="mx-auto size-8 text-muted-foreground mb-2" />
                <h4 className="text-sm font-semibold">
                  {searchQuery ? "No matching repositories" : "No repositories connected yet"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  {searchQuery
                    ? "Try a different search term or check the Available tab."
                    : "Select a repository from your GitHub account in the next tab to get started."}
                </p>
                {!searchQuery && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("available")}
                    className="gap-1.5 text-xs"
                  >
                    <PlusIcon className="size-3.5" />
                    Browse GitHub Repositories
                  </Button>
                )}
              </div>
            ) : null}

            <div className="space-y-2.5">
              {filteredSavedRepos.map((repo) => {
                const isDeleting = deletingId === repo.id && deleteRepositoryMutation.isPending;

                return (
                  <div
                    key={repo.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-3.5 sm:p-4 transition-all hover:bg-muted/40 hover:border-primary/30"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/repository/${repo.id}`}
                          className="font-semibold text-sm sm:text-base hover:text-primary transition-colors truncate"
                        >
                          {repo.owner}/{repo.name}
                        </Link>
                        {getStatusBadge(repo.indexStatus)}
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {repo.visibility}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GitBranchIcon className="size-3" />
                          {repo.defaultBranch}
                        </span>
                        <span>·</span>
                        <span>
                          {repo.lastIndexedAt
                            ? `Last indexed ${new Date(repo.lastIndexedAt).toLocaleDateString()}`
                            : "Not indexed yet"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs gap-1 shadow-sm"
                        nativeButton={false}
                        render={<Link href={`/chat?repo=${repo.id}`} />}
                      >
                        <MessagesSquareIcon className="size-3.5" />
                        Chat
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        nativeButton={false}
                        render={<Link href={`/repository/${repo.id}`} />}
                      >
                        Details
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to disconnect ${repo.owner}/${repo.name}? This will remove stored embeddings.`,
                            )
                          ) {
                            setDeletingId(repo.id);
                            deleteRepositoryMutation.mutate(repo.id, {
                              onSettled: () => setDeletingId(null),
                            });
                          }
                        }}
                      >
                        {isDeleting ? <Spinner /> : <Trash2Icon className="size-3.5" />}
                        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Disconnect</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: AVAILABLE GITHUB REPOSITORIES */}
          <TabsContent value="available" className="space-y-3 focus-visible:outline-none">
            {githubReposQuery.isLoading ? (
              <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
                <Spinner />
                Fetching repositories from GitHub...
              </div>
            ) : null}

            {githubReposQuery.isError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  GitHub Connection Required
                </div>
                <p className="text-xs text-muted-foreground">
                  {githubReposQuery.error?.message ||
                    "Could not retrieve GitHub repositories. Please verify that your GitHub account is linked in your Clerk profile."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => githubReposQuery.refetch()}
                  className="gap-1.5 text-xs mt-1"
                >
                  <RefreshCwIcon className="size-3" />
                  Retry GitHub Sync
                </Button>
              </div>
            ) : null}

            {!githubReposQuery.isLoading &&
            !githubReposQuery.isError &&
            filteredGithubRepos.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? "No GitHub repositories matching your filter."
                  : "No GitHub repositories found."}
              </div>
            ) : null}

            <div className="space-y-2.5">
              {filteredGithubRepos.map((repo) => {
                const isSaved = savedRepoGithubIds.has(String(repo.id));
                const isSaving = savingId === String(repo.id) && saveRepositoryMutation.isPending;

                return (
                  <div
                    key={repo.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-3.5 sm:p-4 transition-all hover:bg-muted/30"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {repo.fullName}
                        </span>
                        <Badge
                          variant={repo.private ? "secondary" : "outline"}
                          className="text-[11px]"
                        >
                          {repo.private ? "Private" : "Public"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranchIcon className="size-3" />
                        <span>{repo.defaultBranch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isSaved ? "secondary" : "default"}
                        size="sm"
                        disabled={isSaved || isSaving}
                        onClick={() => {
                          setSavingId(String(repo.id));
                          saveRepositoryMutation.mutate(repo, {
                            onSettled: () => setSavingId(null),
                          });
                        }}
                        className="text-xs gap-1.5"
                      >
                        {isSaving ? (
                          <>
                            <Spinner />
                            <span>Adding...</span>
                          </>
                        ) : isSaved ? (
                          <>
                            <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <PlusIcon className="size-3.5" />
                            <span>Connect</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
