"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  ArrowRightIcon,
  Clock3Icon,
  DatabaseZapIcon,
  FolderGit2Icon,
  GitBranchIcon,
  GlobeIcon,
  LockIcon,
  MessagesSquareIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import type { SerializedRepository } from "@/lib/repositories/serialize";

async function fetchSavedRepositories(): Promise<SerializedRepository[]> {
  const response = await fetch("/api/repositories");
  if (!response.ok) {
    throw new Error("Unable to load repositories");
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
          Pending Index
        </Badge>
      );
  }
}

export function DashboardPage({
  initialRepositories = [],
}: {
  initialRepositories?: SerializedRepository[];
}) {
  const { data: repositories = initialRepositories } = useQuery({
    queryKey: ["saved-repositories"],
    queryFn: fetchSavedRepositories,
    initialData: initialRepositories,
  });

  const totalRepos = repositories.length;
  const indexedRepos = repositories.filter((r) => r.indexStatus === "COMPLETED").length;
  const pendingRepos = repositories.filter(
    (r) => r.indexStatus === "PENDING" || r.indexStatus === "INDEXING",
  ).length;
  const readinessRate = totalRepos > 0 ? `${Math.round((indexedRepos / totalRepos) * 100)}%` : "0%";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          label="Overview"
          title="Welcome to CodeLens"
          description="Connect repositories, index codebases, and chat with your code using AI-powered search."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button render={<Link href="/repositories" />} size="sm" className="gap-1.5 shadow-sm">
            <PlusIcon className="size-4" />
            Connect Repository
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" render={<Link href="/chat" />}>
            <MessagesSquareIcon className="size-4" />
            Open Chat
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Repositories"
          value={String(totalRepos)}
          description="Connected codebases"
          icon={FolderGit2Icon}
        />

        <StatCard
          title="Indexed"
          value={String(indexedRepos)}
          description="Ready for semantic chat"
          icon={DatabaseZapIcon}
        />

        <StatCard
          title="Pending / Indexing"
          value={String(pendingRepos)}
          description="Awaiting processing"
          icon={Clock3Icon}
        />

        <StatCard
          title="Index Readiness"
          value={readinessRate}
          description="Ready for retrieval"
          icon={ActivityIcon}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Connected Repositories</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Repositories currently saved and monitored in your workspace.
            </p>
          </div>
          {totalRepos > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              render={<Link href="/repositories" />}
            >
              View all ({totalRepos})
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Button>
          )}
        </div>

        {totalRepos === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
                <FolderGit2Icon className="size-7" />
              </div>
              <CardTitle className="text-lg">No repositories connected yet</CardTitle>
              <CardDescription className="max-w-md mt-1.5 mb-6 text-sm">
                Connect your GitHub repositories to generate embeddings, enable AST chunking, and
                start chatting with your codebase.
              </CardDescription>
              <Button render={<Link href="/repositories" />} className="gap-2 shadow-sm">
                <PlusIcon className="size-4" />
                Connect your first repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repositories.slice(0, 6).map((repo) => (
              <Card
                key={repo.id}
                className="group relative flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {repo.owner}
                      </p>
                      <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                    {getStatusBadge(repo.indexStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GitBranchIcon className="size-3.5" />
                      <span>{repo.defaultBranch}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      {repo.visibility === "private" ? (
                        <>
                          <LockIcon className="size-3.5" />
                          <span>Private</span>
                        </>
                      ) : (
                        <>
                          <GlobeIcon className="size-3.5" />
                          <span>Public</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      render={<Link href={`/repository/${repo.id}`} />}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      render={<Link href={`/chat?repo=${repo.id}`} />}
                    >
                      <MessagesSquareIcon className="size-3.5" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              How CodeLens Works
            </CardTitle>
            <CardDescription>
              End-to-end intelligence pipeline for large repositories.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                1
              </div>
              <h4 className="text-sm font-semibold">Connect & Sync</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Import any public or private GitHub repository securely with OAuth.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                2
              </div>
              <h4 className="text-sm font-semibold">Parse & Embed</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AST chunking preserves function and module boundaries with 1536-dim vector
                embeddings.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                3
              </div>
              <h4 className="text-sm font-semibold">Ask & Inspect</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask questions in natural language and get cited answers with exact line numbers.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SearchIcon className="size-4 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-10 gap-2.5"
              render={<Link href="/repositories" />}
            >
              <FolderGit2Icon className="size-4 text-primary" />
              <span>Manage Repositories</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-10 gap-2.5"
              render={<Link href="/chat" />}
            >
              <MessagesSquareIcon className="size-4 text-primary" />
              <span>Ask Codebase Assistant</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-10 gap-2.5"
              render={<Link href="/settings" />}
            >
              <ActivityIcon className="size-4 text-primary" />
              <span>Check System & Settings</span>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
