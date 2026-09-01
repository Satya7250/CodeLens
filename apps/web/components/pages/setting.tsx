import { GitFork, Settings2Icon, UserIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Workspace"
        title="Settings"
        description="Manage your account, GitHub connection, and CodeLens preferences."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5" />
              Account
            </CardTitle>

            <CardDescription>Manage your profile and workspace access.</CardDescription>
          </CardHeader>

          <CardContent>
            <EmptyState message="Account settings coming soon." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitFork className="size-5" />
              GitHub
            </CardTitle>

            <CardDescription>Configure repository access and integrations.</CardDescription>
          </CardHeader>

          <CardContent>
            <EmptyState message="GitHub settings coming soon." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2Icon className="size-5" />
              Preferences
            </CardTitle>

            <CardDescription>Customize your CodeLens experience.</CardDescription>
          </CardHeader>

          <CardContent>
            <EmptyState message="Workspace preferences coming soon." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
