import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getGithubRepositoriesForCurrentUser } from "@/lib/github/get-user-repositories";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  const githubToken = tokens.data[0]?.token;

  if (!githubToken) {
    return NextResponse.json({ error: "GitHub access token not found" }, { status: 400 });
  }

  try {
    const repositories = await getGithubRepositoriesForCurrentUser(githubToken);

    return NextResponse.json(repositories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch repositories";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
