// Handles repository embedding recovery by authenticating users, validating repository access,
// triggering missing embedding recovery, and returning recovery statistics.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { syncUser } from "@/lib/auth/sync-user";
import { recoverRepositoryEmbeddings } from "@/lib/embeddings/recover-repository-embeddings";

const repositoryIdSchema = z.string().uuid();

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!repositoryIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }

    const stats = await recoverRepositoryEmbeddings(id, user.id);
    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to recover embeddings.";

    if (message === "Repository not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Repository indexing or embedding recovery is already in progress.") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
