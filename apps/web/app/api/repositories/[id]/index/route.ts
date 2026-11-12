import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isValidRepositoryId } from "@/lib/repositories/validate-repository-id";

import { startIndexing } from "@/lib/indexing/start-indexing";
import { syncUser } from "@/lib/auth/sync-user";

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
    if (!isValidRepositoryId(id)) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }

    const stats = await startIndexing(id, user.id, clerkUserId);

    // Invalidate the repository detail page cache so it re-fetches fresh data
    revalidatePath(`/repository/${id}`);

    return NextResponse.json({
      success: true,
      filesScanned: stats.filesScanned,
      filesIndexed: stats.filesIndexed,
      chunksCreated: stats.chunksCreated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to index repository";

    if (message === "Repository not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "Repository indexing is already in progress.") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
