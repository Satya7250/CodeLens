import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserRepositories } from "@repo/github";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clerkClient();

    const oauthTokens = await client.users.getUserOauthAccessToken(userId, "github");

    if (!oauthTokens.data.length) {
      return NextResponse.json(
        {
          error: "GitHub account is not connected to this user.",
        },
        { status: 400 },
      );
    }

    const githubToken = oauthTokens.data[0]?.token;

    if (!githubToken) {
      return NextResponse.json(
        {
          error: "GitHub access token could not be retrieved.",
        },
        { status: 400 },
      );
    }

    const repositories = await getUserRepositories(githubToken);

    return NextResponse.json(repositories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch GitHub repositories.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
