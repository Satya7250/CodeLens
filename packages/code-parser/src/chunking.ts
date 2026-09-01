// Represents a piece of a file with line number information.
export type FileChunk = {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
};

// Converts all line endings to "\n" format.
function normalizeLineBreaks(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Splits a file into smaller chunks based on line count.
export function chunkFileContent(content: string, filePath: string, chunkSize = 200): FileChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer.");
  }

  const normalizedContent = normalizeLineBreaks(content);

  if (!normalizedContent) {
    return [];
  }

  const lines = normalizedContent.split("\n");
  const lastLine = lines.at(-1);

  if (lastLine === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    return [];
  }

  const chunks: FileChunk[] = [];

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
