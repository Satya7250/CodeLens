import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { syncUser } from "@/lib/auth/sync-user";
import { getRepositoryForUser } from "@/lib/repositories/get-repository";
import { serializeRepository } from "@/lib/repositories/serialize";
import { deleteRepository } from "@repo/db";

const repositoryIdSchema = z.string().uuid();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!repositoryIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }

    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repository = await getRepositoryForUser(id, user.id);
    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json(serializeRepository(repository));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!repositoryIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }

    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repository = await getRepositoryForUser(id, user.id);
    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    await deleteRepository(id);

    revalidatePath("/repositories");
    revalidatePath("/dashboard");
    revalidatePath("/chat");

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
