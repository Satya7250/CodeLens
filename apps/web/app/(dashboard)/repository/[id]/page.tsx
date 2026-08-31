import { notFound } from "next/navigation";
import { FolderIcon, MessageSquareTextIcon } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { syncUser } from "@/lib/auth/sync-user";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await syncUser();
  const repository = user ? await getRepositoryForUser(id, user.id) : null;

  if (!repository) {
    notFound();
  }

  return (
    <DashboardShell>
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Repository</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {repository.owner}/{repository.name}
        </h1>
        <p className="text-muted-foreground">
          Default branch: <span className="font-medium text-foreground">{repository.defaultBranch}</span>
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Index status</CardDescription>
            <CardTitle>
              <Badge variant={repository.indexStatus === "INDEXED" ? "default" : "secondary"}>
                {repository.indexStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Visibility</CardDescription>
            <CardTitle className="capitalize">{repository.visibility}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last indexed</CardDescription>
            <CardTitle className="text-base">
              {repository.lastIndexedAt ? repository.lastIndexedAt.toLocaleString() : "Not indexed yet"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="size-5" />
              File explorer
            </CardTitle>
            <CardDescription>Repository files will be available after indexing is implemented.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              File explorer placeholder
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareTextIcon className="size-5" />
              Repository chat
            </CardTitle>
            <CardDescription>Ask questions about this repository after indexing is available.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Chat placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
