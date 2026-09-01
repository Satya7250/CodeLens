/** @jsxImportSource react */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RepositoryIndexButton({ repositoryId }: { repositoryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stats, setStats] = useState<{ filesIndexed: number; chunksCreated: number } | null>(null);

  const handleIndex = async () => {
    setIsPending(true);
    setIsSuccess(false);

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to start indexing.");
      }

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        filesIndexed?: number;
        chunksCreated?: number;
      } | null;

      if (!payload?.success) {
        throw new Error("Indexing request was not accepted.");
      }

      setStats({
        filesIndexed: payload.filesIndexed ?? 0,
        chunksCreated: payload.chunksCreated ?? 0,
      });
      setIsSuccess(true);

      // Refresh the page to fetch updated repository status from database
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start indexing.";
      console.error(message);
      setStats(null);
    } finally {
      setIsPending(false);
    }
  };

  const label = isPending
    ? "Indexing..."
    : isSuccess && stats
      ? `Indexed ${stats.filesIndexed} files\n${stats.chunksCreated} chunks created`
      : isSuccess
        ? "Indexed"
        : "Index Repository";

  return (
    <Button
      size="lg"
      onClick={handleIndex}
      disabled={isPending}
      className="whitespace-pre-line text-left"
    >
      {label}
    </Button>
  );
}
