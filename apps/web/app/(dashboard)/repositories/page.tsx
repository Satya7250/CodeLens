import { RepositorySelector } from "@/components/repository-selector";
import { DashboardShell } from "@/components/dashboard-shell";

export default function RepositoriesPage() {
  return (
    <DashboardShell>
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your repositories</h1>
        <p className="max-w-2xl text-muted-foreground">
          Connect GitHub repositories to explore their structure and prepare them for CodeLens.
        </p>
      </section>
      <RepositorySelector />
    </DashboardShell>
  );
}
