import type { GitHubRepository as CodeLensGitHubRepository } from "@repo/types";

import { createGitHubClient } from "./client";

export type GitHubTreeNode = {
  path?: string;
  type?: string;
  sha?: string;
  mode?: string;
};

export type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit" | "submodule";
  sha: string;
  mode: string;
};

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

function normalizeFilePath(filePath: string): string {
  const normalizedPath = filePath.trim();

  if (!normalizedPath) {
    throw new Error("GitHub file path is required.");
  }

  return normalizedPath;
}

function toGitHubApiError(context: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`${context}: ${error.message}`);
  }

  return new Error(`${context}: Unknown GitHub API error.`);
}

// Gets all files and folders from a GitHub repository branch.
export async function getRepositoryTree(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTreeEntry[]> {
  const github = createGitHubClient(token);
  const repositoryOwner = normalizeRepositoryOwner(owner);
  const repositoryName = normalizeRepositoryName(repo);
  const branchName = normalizeBranch(branch);

  try {
    const { data: branchData } = await github.repos.getBranch({
      owner: repositoryOwner,
      repo: repositoryName,
      branch: branchName,
    });

    const treeSha = branchData.commit?.sha ?? branchName;

    const { data: treeData } = await github.git.getTree({
      owner: repositoryOwner,
      repo: repositoryName,
      tree_sha: treeSha,
      recursive: "true",
    });

    const treeEntries = (treeData.tree as GitHubTreeNode[]).filter(
      (
        entry,
      ): entry is Required<Pick<GitHubTreeNode, "path" | "type" | "sha" | "mode">> &
        GitHubTreeNode => typeof entry.path === "string" && entry.path.length > 0,
    );

    return treeEntries.map((entry) => ({
      path: entry.path,
      type: (entry.type as GitHubTreeEntry["type"]) ?? "blob",
      sha: entry.sha ?? "",
      mode: entry.mode ?? "100644",
    }));
  } catch (error) {
    throw toGitHubApiError(
      `Unable to fetch the repository tree for ${repositoryOwner}/${repositoryName} on ${branchName}`,
      error,
    );
  }
}

// Fetches and returns the content of a file from a GitHub repository.
export async function getRepositoryFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  const github = createGitHubClient(token);
  const repositoryOwner = normalizeRepositoryOwner(owner);
  const repositoryName = normalizeRepositoryName(repo);
  const filePath = normalizeFilePath(path);

  try {
    const { data } = await github.repos.getContent({
      owner: repositoryOwner,
      repo: repositoryName,
      path: filePath,
    });

    if (Array.isArray(data)) {
      throw new Error(`The provided path "${filePath}" points to a directory, not a file.`);
    }

    if (!("content" in data) || typeof data.content !== "string") {
      throw new Error(`No file content was returned for "${filePath}".`);
    }

    const normalizedContent = data.content.replace(/\s/g, "");

    if (!normalizedContent) {
      return "";
    }

    return Buffer.from(normalizedContent, "base64").toString("utf8");
  } catch (error) {
    throw toGitHubApiError(
      `Unable to fetch file content for ${repositoryOwner}/${repositoryName}:${filePath}`,
      error,
    );
  }
}
