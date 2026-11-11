import { getSavedRepositoriesForUser } from "@/lib/repositories/get-user-repositories";
import { syncUser } from "@/lib/auth/sync-user";
import { PageHeader } from "./page-header";
import { RepositoryChatSelector } from "./repository-chat-selector";

export async function ChatPage() {
  const user = await syncUser();
  if (!user) {
    throw new Error("Unable to load the signed-in user for chat.");
  }

  const repositories = await getSavedRepositoriesForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        label="AI Assistant"
        title="Chat"
        description="Ask questions about your repositories, code structure, functions, bugs, or implementation details."
      />
      <RepositoryChatSelector
        repositories={repositories.map(({ id, owner, name, indexStatus }) => ({
          id,
          owner,
          name,
          indexStatus,
        }))}
      />
    </div>
  );
}
