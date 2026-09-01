import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { startIndexing } from "@/lib/indexing/start-indexing";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const stats = await startIndexing(id, userId);

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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
