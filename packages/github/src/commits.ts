import { createGitHubClient } from "./client";

function normalizeRepositoryOwner(owner: string): string {
  const normalizedOwner = owner.trim();

  if (!normalizedOwner) {
    throw new Error("GitHub repository owner is required.");
  }

  return normalizedOwner;
}

function normalizeRepositoryName(repo: string): string {
  const normalizedRepo = repo.trim();

  if (!normalizedRepo) {
    throw new Error("GitHub repository name is required.");
  }

  return normalizedRepo;
}

function normalizeBranch(branch: string): string {
  const normalizedBranch = branch.trim();

  if (!normalizedBranch) {
    throw new Error("GitHub branch name is required.");
  }

  return normalizedBranch;
}

function toGitHubApiError(context: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`${context}: ${error.message}`);
  }

  return new Error(`${context}: Unknown GitHub API error.`);
}

/**
 * Returns the latest commit SHA for a branch.
 */
export async function getLatestCommitSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const github = createGitHubClient(token);

  const repositoryOwner = normalizeRepositoryOwner(owner);
  const repositoryName = normalizeRepositoryName(repo);
  const branchName = normalizeBranch(branch);

  try {
    const { data } = await github.repos.getBranch({
      owner: repositoryOwner,
      repo: repositoryName,
      branch: branchName,
    });

    const sha = data.commit?.sha;

    if (!sha) {
      throw new Error(`No commit SHA found for branch "${branchName}".`);
    }

    return sha;
  } catch (error) {
    throw toGitHubApiError(
      `Unable to fetch latest commit SHA for ${repositoryOwner}/${repositoryName}@${branchName}`,
      error,
    );
  }
}
