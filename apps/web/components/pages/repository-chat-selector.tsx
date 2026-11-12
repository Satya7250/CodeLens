"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircleIcon, DatabaseZapIcon, FolderGit2Icon, PlusIcon } from "lucide-react";

import { CodeChat } from "@/components/repository/code-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RepositoryOption = {
  id: string;
  owner: string;
  name: string;
  indexStatus: "PENDING" | "INDEXING" | "COMPLETED" | "FAILED";
};

function RepositoryChatSelectorInner({ repositories }: { repositories: RepositoryOption[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRepoId = searchParams.get("repo");

  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);

  const selectedRepositoryId =
    userSelectedId ??
    (initialRepoId && repositories.some((r) => r.id === initialRepoId)
      ? initialRepoId
      : (repositories[0]?.id ?? ""));

  const selectedRepository = repositories.find(
    (repository) => repository.id === selectedRepositoryId,
  );

  const handleSelectRepository = (id: string) => {
    setUserSelectedId(id);
    router.replace(`/chat?repo=${id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Select Repository</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Choose an indexed repository to query code, trace dependencies, and inspect
                implementations.
              </CardDescription>
            </div>
            {repositories.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="self-start sm:self-auto text-xs gap-1.5"
                nativeButton={false}
                render={<Link href="/repositories" />}
              >
                <PlusIcon className="size-3.5" />
                Add Repository
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {repositories.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-3">
              <FolderGit2Icon className="mx-auto size-10 text-muted-foreground" />
              <div className="space-y-1">
                <h4 className="text-base font-semibold">No saved repositories</h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  You haven&apos;t connected any repositories to CodeLens yet. Connect one to start
                  asking questions.
                </p>
              </div>
              <Button
                nativeButton={false}
                render={<Link href="/repositories" />}
                className="gap-2 shadow-sm text-xs sm:text-sm"
              >
                <PlusIcon className="size-4" />
                Connect Repositories
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Responsive repository pills / buttons */}
              <div className="flex flex-wrap gap-2">
                {repositories.map((repository) => {
                  const isSelected = repository.id === selectedRepositoryId;
                  const isReady = repository.indexStatus === "COMPLETED";

                  return (
                    <button
                      key={repository.id}
                      type="button"
                      onClick={() => handleSelectRepository(repository.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm dark:bg-primary/20 dark:text-primary-foreground font-semibold"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      <FolderGit2Icon className="size-4 shrink-0" />
                      <span className="truncate max-w-[12rem] sm:max-w-[16rem]">
                        {repository.owner}/{repository.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-1.5 font-normal ${
                          isReady
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {isReady ? "Ready" : repository.indexStatus}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              {/* Status banner for non-completed repositories */}
              {selectedRepository && selectedRepository.indexStatus !== "COMPLETED" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircleIcon className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-semibold">Repository has not been indexed</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedRepository.indexStatus === "INDEXING"
                          ? "Indexing is currently in progress. Questions will have full source context once complete."
                          : "This repository has no vector embeddings yet. Index it first to enable intelligent context retrieval."}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="shrink-0 text-xs gap-1.5 shadow-sm"
                    nativeButton={false}
                    render={<Link href={`/repository/${selectedRepository.id}`} />}
                  >
                    <DatabaseZapIcon className="size-3.5" />
                    {selectedRepository.indexStatus === "INDEXING"
                      ? "View Indexing Status"
                      : "Index Repository"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRepository ? (
        <CodeChat key={selectedRepository.id} repositoryId={selectedRepository.id} />
      ) : null}
    </div>
  );
}

export function RepositoryChatSelector({ repositories }: { repositories: RepositoryOption[] }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
          Loading chat interface...
        </div>
      }
    >
      <RepositoryChatSelectorInner repositories={repositories} />
    </Suspense>
  );
}
