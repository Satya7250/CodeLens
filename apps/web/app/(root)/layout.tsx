import { auth } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { syncUser } from "@/lib/auth/sync-user";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();
  await syncUser();

  return <DashboardShell>{children}</DashboardShell>;
}
