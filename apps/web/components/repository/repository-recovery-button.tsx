"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WrenchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function RepositoryRecoveryButton({ repositoryId }: { repositoryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleRecover = async () => {
    setIsPending(true);
    toast.loading("Scanning and regenerating missing embeddings...", { id: "recover-toast" });

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/recover-embeddings`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        recoveredChunks?: number;
        error?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to recover embeddings.");
      }

      toast.success(
        payload.recoveredChunks && payload.recoveredChunks > 0
          ? `Recovered ${payload.recoveredChunks} missing embeddings.`
          : "All code chunk embeddings are healthy and up to date.",
        { id: "recover-toast" },
      );

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to recover embeddings.";
      toast.error(message, { id: "recover-toast" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRecover}
      disabled={isPending}
      className="text-xs gap-1.5"
    >
      {isPending ? <Spinner /> : <WrenchIcon className="size-3.5" />}
      <span>Verify / Recover Embeddings</span>
    </Button>
  );
}
