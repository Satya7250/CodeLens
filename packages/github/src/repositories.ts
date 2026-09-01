import type { GitHubRepository as CodeLensGitHubRepository } from "@repo/types";

import { createGitHubClient } from "./client";

// Converts a GitHub repository response into the CodeLens repository format.
function toCodeLensRepository(repo: {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string } | null;
  default_branch: string;
  private: boolean;
}): CodeLensGitHubRepository {
  const ownerLogin = repo.owner?.login?.trim();

  if (!repo.name.trim()) {
    throw new Error("GitHub repository name is required.");
  }

  if (!ownerLogin) {
    throw new Error(`GitHub repository owner is required for ${repo.name}.`);
  }

  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name || `${ownerLogin}/${repo.name}`,
    owner: ownerLogin,
    defaultBranch: repo.default_branch || "main",
    private: repo.private,
  };
}

// Converts GitHub API errors into readable application errors.
function toGitHubApiError(context: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`${context}: ${error.message}`);
  }

  return new Error(`${context}: Unknown GitHub API error.`);
}

// Fetches all repositories that belong to the authenticated GitHub user.
export async function getUserRepositories(token: string): Promise<CodeLensGitHubRepository[]> {
  const github = createGitHubClient(token);

  try {
    const { data } = await github.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return data.map((repo) => toCodeLensRepository(repo));
  } catch (error) {
    throw toGitHubApiError("Unable to fetch authenticated user repositories", error);
  }
}

// Fetches details for a specific GitHub repository.
export async function getRepository(
  token: string,
  owner: string,
  repo: string,
): Promise<CodeLensGitHubRepository> {
  const github = createGitHubClient(token);
  const repositoryOwner = owner.trim();
  const repositoryName = repo.trim();

  if (!repositoryOwner) {
    throw new Error("GitHub repository owner is required.");
  }

  if (!repositoryName) {
    throw new Error("GitHub repository name is required.");
  }

  try {
    const { data } = await github.repos.get({
      owner: repositoryOwner,
      repo: repositoryName,
    });

    return toCodeLensRepository(data);
  } catch (error) {
    throw toGitHubApiError(
      `Unable to fetch repository details for ${repositoryOwner}/${repositoryName}`,
      error,
    );
  }
}
