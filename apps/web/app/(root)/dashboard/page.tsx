import { DashboardPage } from "@/components/pages/dashboard";
import { syncUser } from "@/lib/auth/sync-user";
import { getSavedRepositoriesForUser } from "@/lib/repositories/get-user-repositories";
import { serializeRepositories } from "@/lib/repositories/serialize";

export default async function Page() {
  const user = await syncUser();
  const repositories = user ? await getSavedRepositoriesForUser(user.id) : [];

  return <DashboardPage initialRepositories={serializeRepositories(repositories)} />;
}
