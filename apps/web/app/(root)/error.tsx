"use client";

import { useEffect } from "react";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-6" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this view."}
        </p>
      </div>

      <Button onClick={() => reset()} size="sm" className="gap-1.5 shadow-sm text-xs">
        <RefreshCwIcon className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
