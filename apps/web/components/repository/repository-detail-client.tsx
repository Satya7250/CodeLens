"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FolderGit2Icon,
  GitBranchIcon,
  GlobeIcon,
  LockIcon,
  MessagesSquareIcon,
  RadarIcon,
  SearchIcon,
  ShieldCheckIcon,
  TimerResetIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepositoryIndexButton } from "@/components/repository/repository-index-button";
import { RepositoryRecoveryButton } from "@/components/repository/repository-recovery-button";
import { SemanticCodeSearch } from "@/components/repository/semantic-code-search";
import { CodeChat } from "@/components/repository/code-chat";
import type { SerializedRepository } from "@/lib/repositories/serialize";

export function RepositoryDetailClient({ repository }: { repository: SerializedRepository }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("chat");

  // Auto-poll when indexing is in progress
  useEffect(() => {
    if (repository.indexStatus !== "INDEXING") return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [repository.indexStatus, router]);

  const lastIndexedLabel = repository.lastIndexedAt
    ? new Date(repository.lastIndexedAt).toLocaleString()
    : "Not indexed yet";

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              render={<Link href="/repositories" />}
            >
              <ArrowLeftIcon className="size-3.5 mr-1" />
              All Repositories
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
              {repository.owner}/{repository.name}
            </h1>
            <a
              href={`https://github.com/${repository.owner}/${repository.name}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Open repository on GitHub"
            >
              <ExternalLinkIcon className="size-4" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranchIcon className="size-3.5" />
              <span>{repository.defaultBranch}</span>
            </span>
            <span>·</span>
            <Badge
              variant={repository.visibility === "private" ? "secondary" : "outline"}
              className="text-xs"
            >
              {repository.visibility === "private" ? (
                <LockIcon className="size-3 mr-1" />
              ) : (
                <GlobeIcon className="size-3 mr-1" />
              )}
              {repository.visibility}
            </Badge>
            <span>·</span>
            <Badge
              variant={
                repository.indexStatus === "COMPLETED"
                  ? "outline"
                  : repository.indexStatus === "INDEXING"
                    ? "default"
                    : "secondary"
              }
              className={`text-xs ${
                repository.indexStatus === "COMPLETED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : repository.indexStatus === "INDEXING"
                    ? "animate-pulse"
                    : ""
              }`}
            >
              {repository.indexStatus === "COMPLETED" ? "Indexed" : repository.indexStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RepositoryIndexButton
            repositoryId={repository.id}
            currentIndexStatus={repository.indexStatus}
          />
        </div>
      </header>

      {/* Tabs navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as string)}
        className="w-full space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
            <MessagesSquareIcon className="size-3.5 sm:size-4" />
            <span>AI Chat</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm">
            <SearchIcon className="size-3.5 sm:size-4" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <FolderGit2Icon className="size-3.5 sm:size-4" />
            <span>Overview</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AI CODE CHAT */}
        <TabsContent value="chat" className="space-y-4 focus-visible:outline-none">
          {repository.indexStatus !== "COMPLETED" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
              <span>
                This repository is not indexed yet. Index it to provide full codebase context and
                code citations to the AI.
              </span>
              <Button
                size="xs"
                variant="outline"
                className="shrink-0 text-xs"
                onClick={() => setActiveTab("overview")}
              >
                Index Details
              </Button>
            </div>
          )}
          <CodeChat repositoryId={repository.id} />
        </TabsContent>

        {/* TAB 2: SEMANTIC CODE SEARCH */}
        <TabsContent value="search" className="space-y-4 focus-visible:outline-none">
          <SemanticCodeSearch repositoryId={repository.id} />
        </TabsContent>

        {/* TAB 3: OVERVIEW & INDEXING */}
        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Owner
                </CardDescription>
                <CardTitle className="text-base sm:text-lg truncate">{repository.owner}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <GitBranchIcon className="size-3" />
                  Branch
                </CardDescription>
                <CardTitle className="text-base sm:text-lg truncate">
                  {repository.defaultBranch}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Visibility
                </CardDescription>
                <CardTitle className="text-base sm:text-lg capitalize">
                  {repository.visibility}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <ShieldCheckIcon className="size-3" />
                  Index Status
                </CardDescription>
                <CardTitle className="text-base sm:text-lg">
                  <Badge variant={repository.indexStatus === "COMPLETED" ? "default" : "secondary"}>
                    {repository.indexStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          </section>

          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <TimerResetIcon className="size-3.5" />
                Indexing History & Health
              </CardDescription>
              <CardTitle className="text-base sm:text-lg font-medium">{lastIndexedLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 text-xs sm:text-sm text-muted-foreground">
              {repository.indexStatus === "COMPLETED" && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-emerald-800 dark:text-emerald-300">
                  ✓ Repository was successfully indexed. All chunks have been embedded using
                  1536-dimensional vector representations and are ready for retrieval.
                </div>
              )}
              {repository.indexStatus === "INDEXING" && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3.5 text-blue-800 dark:text-blue-300">
                  ⏳ Codebase is being parsed and embedded. This page will automatically update once
                  processing finishes.
                </div>
              )}
              {repository.indexStatus === "PENDING" && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-amber-800 dark:text-amber-300">
                  → Repository has not been indexed yet. Use the Index button above to begin.
                </div>
              )}
              {repository.indexStatus === "FAILED" && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-destructive">
                  ✗ The last indexing attempt failed. Please check your GitHub permissions or try
                  re-indexing.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <RepositoryRecoveryButton repositoryId={repository.id} />
              </div>
            </CardContent>
          </Card>

          <section className="rounded-2xl border border-dashed bg-muted/20 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <RadarIcon className="size-4 text-primary" />
              AST & Semantic Pipeline Architecture
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              CodeLens parses repository files using tree-aware AST extraction to preserve logical
              class, function, and interface boundaries. Chunks are embedded with OpenRouter vector
              models and indexed into PostgreSQL using cosine-distance HNSW indexes.
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
