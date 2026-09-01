// Maps file extensions to programming languages.
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  go: "go",
  java: "java",
  rs: "rust",
  php: "php",
  rb: "ruby",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  md: "markdown",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
};

// Detects the language of a file based on its extension.
export function detectLanguage(path: string): string | null {
  const normalizedPath = path.replace(/\\/g, "/").trim();

  if (!normalizedPath) {
    return null;
  }

  const extension = normalizedPath.split(".").pop()?.toLowerCase() ?? "";

  if (!extension) {
    return null;
  }

  return LANGUAGE_BY_EXTENSION[extension] ?? null;
}
