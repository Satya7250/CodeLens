import { notFound } from "next/navigation";
import {
  ArrowUpRightIcon,
  GitBranchIcon,
  GlobeIcon,
  LockIcon,
  RadarIcon,
  ShieldCheckIcon,
  TimerResetIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryIndexButton } from "@/components/repository/repository-index-button";

import { syncUser } from "@/lib/auth/sync-user";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";

export async function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await syncUser();
  const repository = user ? await getRepositoryForUser(id, user.id) : null;

  if (!repository) {
    notFound();
  }

  const visibilityLabel = repository.visibility.toLowerCase();
  const lastIndexedLabel = repository.lastIndexedAt
    ? repository.lastIndexedAt.toLocaleString()
    : "Not indexed yet";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Repository Details</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {repository.owner}/{repository.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranchIcon className="size-4" />
            <span>{repository.defaultBranch}</span>
          </div>
        </div>

        <RepositoryIndexButton repositoryId={repository.id} />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <ArrowUpRightIcon className="size-3.5" />
              Owner
            </CardDescription>
            <CardTitle className="text-xl">{repository.owner}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <GitBranchIcon className="size-3.5" />
              Default branch
            </CardDescription>
            <CardTitle className="text-xl">{repository.defaultBranch}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {repository.visibility === "private" ? (
                <LockIcon className="size-3.5" />
              ) : (
                <GlobeIcon className="size-3.5" />
              )}
              Visibility
            </CardDescription>
            <CardTitle className="text-xl capitalize">{visibilityLabel}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              Index status
            </CardDescription>
            <CardTitle className="text-xl">
              <Badge variant={repository.indexStatus === "INDEXED" ? "default" : "secondary"}>
                {repository.indexStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <TimerResetIcon className="size-3.5" />
            Last indexed
          </CardDescription>
          <CardTitle className="text-lg font-medium text-foreground">{lastIndexedLabel}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Repository data is stored and associated with the authenticated user. Indexing is prepared
          but not yet executing a live GitHub sync.
        </CardContent>
      </Card>

      <section className="rounded-2xl border border-dashed bg-muted/20 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RadarIcon className="size-4" />
          Indexing workflow
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The repository is ready for future indexing jobs, chunking, and semantic search workflows.
        </p>
      </section>
    </div>
  );
}
