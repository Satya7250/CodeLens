"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatabaseZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function RepositoryIndexButton({
  repositoryId,
  currentIndexStatus,
}: {
  repositoryId: string;
  currentIndexStatus?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleIndex = async () => {
    setIsPending(true);
    setErrorMessage(null);
    toast.loading("Starting codebase indexing...", { id: "indexing-toast" });

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        filesScanned?: number;
        filesIndexed?: number;
        chunksCreated?: number;
        error?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to start indexing.");
      }

      toast.success(
        `Indexing complete! Scanned ${payload.filesScanned ?? 0} files, indexed ${
          payload.filesIndexed ?? 0
        } files into ${payload.chunksCreated ?? 0} code chunks.`,
        { id: "indexing-toast", duration: 5000 },
      );

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start indexing.";
      setErrorMessage(message);
      toast.error(message, { id: "indexing-toast" });
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  const isIndexingNow = isPending || currentIndexStatus === "INDEXING";

  return (
    <div className="flex flex-col sm:items-end gap-1.5">
      <Button
        size="default"
        onClick={handleIndex}
        disabled={isIndexingNow}
        className="w-full sm:w-auto gap-2 shadow-sm"
      >
        {isIndexingNow ? (
          <>
            <Spinner />
            <span>Indexing codebase...</span>
          </>
        ) : (
          <>
            <DatabaseZapIcon className="size-4" />
            <span>
              {currentIndexStatus === "COMPLETED" ? "Re-index Repository" : "Index Repository"}
            </span>
          </>
        )}
      </Button>

      {errorMessage ? (
        <p role="alert" className="max-w-xs text-xs text-destructive text-left sm:text-right">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
