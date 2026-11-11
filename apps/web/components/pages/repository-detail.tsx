import { notFound } from "next/navigation";

import { syncUser } from "@/lib/auth/sync-user";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";
import { serializeRepository } from "@/lib/repositories/serialize";
import { RepositoryDetailClient } from "@/components/repository/repository-detail-client";

export async function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await syncUser();
  const repository = user ? await getRepositoryForUser(id, user.id) : null;

  if (!repository) {
    notFound();
  }

  return <RepositoryDetailClient repository={serializeRepository(repository)} />;
}
