import { auth } from "@clerk/nextjs/server";
import { RepositorySearchBodySchema } from "@repo/types";
import { NextResponse } from "next/server";
import { z } from "zod";

import { syncUser } from "@/lib/auth/sync-user";
import { semanticSearch, SemanticSearchProviderError } from "@/lib/search/semantic-search";

const repositoryIdSchema = z.uuid();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!repositoryIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsedBody = RepositorySearchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid search request.", issues: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const results = await semanticSearch(id, user.id, parsedBody.data.query, parsedBody.data.limit);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Error && error.message === "Repository not found") {
      return NextResponse.json({ error: "Repository not found." }, { status: 404 });
    }
    if (error instanceof SemanticSearchProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Unable to search this repository right now. Please try again." },
      { status: 500 },
    );
  }
}
