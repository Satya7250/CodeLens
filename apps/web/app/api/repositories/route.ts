// Provides GET and POST API endpoints to retrieve and save user-specific repositories in the database,
// with authentication, user synchronization, request validation, and response serialization.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { RepositoryCreateSchema } from "@repo/types";

import { syncUser } from "@/lib/auth/sync-user";
import { getSavedRepositoriesForUser } from "@/lib/repositories/get-user-repositories";
import { saveRepositoryForUser } from "@/lib/repositories/create-repository";
import { serializeRepositories, serializeRepository } from "@/lib/repositories/serialize";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUser = await syncUser();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repositories = await getSavedRepositoriesForUser(dbUser.id);

    return NextResponse.json(serializeRepositories(repositories));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch saved repositories";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = RepositoryCreateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid repository payload", issues: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const dbUser = await syncUser();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repository = await saveRepositoryForUser(dbUser.id, parsedBody.data);

    if (!repository) {
      return NextResponse.json({ error: "Unable to save repository" }, { status: 500 });
    }

    return NextResponse.json(serializeRepository(repository), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save repository";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
