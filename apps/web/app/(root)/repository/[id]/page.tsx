import { RepositoryDetailPage } from "@/components/pages/repository-detail";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  return <RepositoryDetailPage {...props} />;
}
