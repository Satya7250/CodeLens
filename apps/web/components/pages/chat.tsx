import { MessageSquareTextIcon, SendIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="AI Assistant"
        title="Chat"
        description="Ask questions about your repositories, code structure, functions, bugs, or implementation details."
      />

      <Card className="min-h-150">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareTextIcon className="size-5" />
            CodeLens Chat
          </CardTitle>

          <CardDescription>
            Select a repository and start chatting with your codebase.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex h-125 flex-col justify-between gap-4">
          <div className="flex-1 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No messages yet.
          </div>

          <div className="flex gap-2">
            <Textarea placeholder="Ask a question about your code..." className="min-h-20" />

            <Button size="icon">
              <SendIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
