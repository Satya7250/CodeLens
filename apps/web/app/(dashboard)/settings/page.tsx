import { Settings2Icon } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-2xl text-muted-foreground">Manage your CodeLens workspace preferences.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2Icon className="size-5" />
            Settings are coming next
          </CardTitle>
          <CardDescription>
            Account, GitHub connections, and workspace preferences will be managed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No settings to configure yet.
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
