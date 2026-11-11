/** @jsxImportSource react */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RepositoryIndexButton({ repositoryId }: { repositoryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    filesScanned: number;
    filesIndexed: number;
    chunksCreated: number;
  } | null>(null);

  const handleIndex = async () => {
    setIsPending(true);
    setIsSuccess(false);
    setErrorMessage(null);

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
        filesScanned?: number;
        filesIndexed?: number;
        chunksCreated?: number;
      } | null;

      if (!payload?.success) {
        throw new Error("Indexing request was not accepted.");
      }

      setStats({
        filesScanned: payload.filesScanned ?? 0,
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
      setErrorMessage(message);
      setStats(null);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  const label = isPending
    ? "Indexing..."
    : isSuccess && stats
      ? `${stats.filesScanned} files scanned\n${stats.filesIndexed} files indexed\n${stats.chunksCreated} chunks created`
      : isSuccess
        ? "Indexed"
        : "Index Repository";

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        onClick={handleIndex}
        disabled={isPending}
        className="whitespace-pre-line text-left"
      >
        {label}
      </Button>
      {errorMessage ? (
        <p role="alert" className="max-w-sm text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
