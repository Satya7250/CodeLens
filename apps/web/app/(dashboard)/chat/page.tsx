import { MessageSquareTextIcon } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <DashboardShell>
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Codebase assistant</p>
        <h1 className="text-3xl font-semibold tracking-tight">Chat</h1>
        <p className="max-w-2xl text-muted-foreground">
          Ask questions about a connected repository once indexing and retrieval are available.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareTextIcon className="size-5" />
            Chat is coming next
          </CardTitle>
          <CardDescription>
            The conversation workspace will appear here after the repository knowledge pipeline is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No conversations yet.
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
