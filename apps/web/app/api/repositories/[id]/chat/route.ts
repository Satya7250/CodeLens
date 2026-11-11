import { auth } from "@clerk/nextjs/server";
import { RepositoryChatBodySchema, RepositoryChatResponseSchema } from "@repo/types";
import { NextResponse } from "next/server";
import { z } from "zod";

import { syncUser } from "@/lib/auth/sync-user";
import { generateCodeAnswer, OpenRouterChatError } from "@/lib/ai/code-chat";
import { SemanticSearchProviderError } from "@/lib/search/semantic-search";

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

    const parsedBody = RepositoryChatBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid chat request.", issues: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await generateCodeAnswer(
      id,
      user.id,
      parsedBody.data.message,
      parsedBody.data.history,
    );
    const validatedResult = RepositoryChatResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      return NextResponse.json(
        { error: "The AI service returned an invalid response." },
        { status: 502 },
      );
    }

    return NextResponse.json(validatedResult.data);
  } catch (error) {
    if (error instanceof Error && error.message === "Repository not found") {
      return NextResponse.json({ error: "Repository not found." }, { status: 404 });
    }
    if (error instanceof OpenRouterChatError || error instanceof SemanticSearchProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Unable to answer this question right now. Please try again." },
      { status: 500 },
    );
  }
}
