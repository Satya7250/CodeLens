const IGNORED_PATH_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
]);

const IGNORE_FILE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "pdf",
  "zip",
  "exe",
  "dll",
  "mp4",
  "mov",
]);

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").trim();
}

export function isIgnoredPath(path: string): boolean {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath) {
    return false;
  }

  const segments = normalizedPath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.toLowerCase());

  return segments.some((segment) => IGNORED_PATH_SEGMENTS.has(segment));
}

export function isIndexableFile(path: string): boolean {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath || normalizedPath.endsWith("/")) {
    return false;
  }

  if (isIgnoredPath(normalizedPath)) {
    return false;
  }

  const fileName = normalizedPath.split("/").pop();

  if (!fileName || fileName.length === 0) {
    return false;
  }

  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : "";

  return extension.length > 0 ? !IGNORE_FILE_EXTENSIONS.has(extension) : true;
}

export function filterRepositoryFiles(paths: string[]): string[] {
  const uniquePaths = new Set<string>();

  for (const path of paths) {
    const normalizedPath = normalizePath(path);

    if (!normalizedPath) {
      continue;
    }

    if (isIndexableFile(normalizedPath)) {
      uniquePaths.add(normalizedPath);
    }
  }

  return Array.from(uniquePaths);
}
