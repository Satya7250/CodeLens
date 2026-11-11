import type { CodeChunk } from "./metadata";

function normalizeLineBreaks(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function chunkFile(content: string, filePath: string): CodeChunk[] {
  const normalizedContent = normalizeLineBreaks(content);

  if (!normalizedContent.trim()) {
    return [];
  }

  const lines = normalizedContent.split("\n");
  while (lines.at(-1) === "") {
    lines.pop();
  }
  const chunkSize = 120;
  const chunks: CodeChunk[] = [];

  for (let index = 0; index < lines.length; index += chunkSize) {
    const chunkLines = lines.slice(index, index + chunkSize);
    const startLine = index + 1;
    const endLine = index + chunkLines.length;

    chunks.push({
      filePath,
      content: chunkLines.join("\n"),
      startLine,
      endLine,
    });
  }

  return chunks;
}
