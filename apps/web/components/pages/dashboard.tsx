import { ActivityIcon, Clock3Icon, DatabaseZapIcon, FolderGit2Icon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { EmptyState } from "./empty-state";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        label="Overview"
        title="Welcome to CodeLens"
        description="Connect repositories, index codebases, and chat with your codebase using AI-powered search and analysis."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Repositories"
          value="0"
          description="Connected repositories"
          icon={FolderGit2Icon}
        />

        <StatCard
          title="Indexed Repositories"
          value="0"
          description="Ready for AI chat"
          icon={DatabaseZapIcon}
        />

        <StatCard
          title="Pending Indexes"
          value="0"
          description="Waiting to be processed"
          icon={Clock3Icon}
        />

        <StatCard title="Activity" value="0" description="Recent actions" icon={ActivityIcon} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Repositories</CardTitle>

            <CardDescription>Your most recently connected repositories.</CardDescription>
          </CardHeader>

          <CardContent>
            <EmptyState message="No repositories connected yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>

            <CardDescription>Repository indexing and AI chat activity.</CardDescription>
          </CardHeader>

          <CardContent>
            <EmptyState message="No activity available." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
