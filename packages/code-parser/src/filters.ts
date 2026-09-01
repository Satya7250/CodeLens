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
  "ico",
  "pdf",
  "zip",
  "tar",
  "gz",
  "exe",
  "dll",
]);

const ALLOWED_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "java",
  "rs",
  "md",
  "json",
  "yml",
  "yaml",
]);

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .trim();
}

export function shouldIndexFile(path: string): boolean {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath || normalizedPath.endsWith("/")) {
    return false;
  }

  const segments = normalizedPath
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  if (segments.some((segment) => IGNORED_PATH_SEGMENTS.has(segment))) {
    return false;
  }

  const fileName = segments[segments.length - 1] ?? "";

  if (!fileName || fileName.startsWith(".")) {
    return false;
  }

  const extension = fileName.includes(".") ? (fileName.split(".").at(-1)?.toLowerCase() ?? "") : "";

  if (!extension || IGNORE_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(extension);
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
  return shouldIndexFile(path);
}

export function filterRepositoryFiles(paths: string[]): string[] {
  const uniquePaths = new Set<string>();

  for (const path of paths) {
    const normalizedPath = normalizePath(path);

    if (!normalizedPath) {
      continue;
    }

    if (shouldIndexFile(normalizedPath)) {
      uniquePaths.add(normalizedPath);
    }
  }

  return Array.from(uniquePaths);
}
