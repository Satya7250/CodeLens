import { RepositorySelector } from "@/components/dashboard/repository-selector";
import { PageHeader } from "./page-header";

export function RepositoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Workspace"
        title="Repositories"
        description="Connect GitHub repositories to CodeLens, manage indexing, and prepare your codebase for AI-powered search and chat."
      />

      <RepositorySelector />
    </div>
  );
}
