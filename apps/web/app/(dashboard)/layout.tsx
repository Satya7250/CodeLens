import { auth } from "@clerk/nextjs/server";

import { syncUser } from "@/lib/auth/sync-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  await syncUser();

  return children;
}
