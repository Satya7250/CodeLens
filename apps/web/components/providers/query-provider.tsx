"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { useAuth } from "@clerk/nextjs";

export function QueryProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  return (
    <UserQueryProvider key={userId ?? "signed-out"}>
      {children}
    </UserQueryProvider>
  );
}

function UserQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
