"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  CheckIcon,
  CopyIcon,
  FileCodeIcon,
  MessageSquareTextIcon,
  RotateCcwIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { RepositoryChatResponseSchema, type ChatMessage, type RepositorySource } from "@repo/types";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ConversationEntry =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      sources: RepositorySource[];
      searchMode: "hybrid" | "keyword";
    };

const MAX_HISTORY_MESSAGES = 8;

const SUGGESTED_PROMPTS = [
  "Explain the project architecture and structure",
  "Where is authentication and authorization handled?",
  "List the core database models and relationships",
  "How are the main API routes implemented?",
];

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100 dark:bg-zinc-900/90 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-3.5 py-1.5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] uppercase tracking-wider">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-zinc-800 text-zinc-300 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="max-h-80 overflow-x-auto p-3.5 text-xs font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Parse markdown code blocks ```lang ... ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {content.slice(lastIndex, match.index)}
        </span>,
      );
    }
    const language = match[1];
    const code = match[2]?.trimEnd() ?? "";
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
        {content.slice(lastIndex)}
      </span>,
    );
  }

  return <div className="text-xs sm:text-sm">{parts}</div>;
}

export function CodeChat({ repositoryId }: { repositoryId: string }) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const pendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isPending]);

  async function sendMessage(textToSend: string) {
    const currentMessage = textToSend.trim();
    if (pendingRef.current || !currentMessage) {
      return;
    }

    pendingRef.current = true;
    setIsPending(true);
    setErrorMessage(null);
    setMessage("");
    setConversation((previous) => [...previous, { role: "user", content: currentMessage }]);

    try {
      const history: ChatMessage[] = conversation.slice(-MAX_HISTORY_MESSAGES).map((entry) => ({
        role: entry.role,
        content: entry.content,
      }));

      const response = await fetch(`/api/repositories/${repositoryId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage, history }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const error =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to get an answer right now.";
        throw new Error(error);
      }

      const parsedResponse = RepositoryChatResponseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        throw new Error("The chat service returned an unexpected response.");
      }

      setConversation((previous) => [
        ...previous,
        {
          role: "assistant",
          content: parsedResponse.data.answer,
          sources: parsedResponse.data.sources,
          searchMode: parsedResponse.data.searchMode,
        },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to get an answer right now.",
      );
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const handleCopyAnswer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquareTextIcon className="size-5 text-primary" />
            AI Codebase Chat
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Answers are grounded in indexed code chunks with exact file and line citations.
          </CardDescription>
        </div>

        {conversation.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConversation([])}
            className="self-start sm:self-auto text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcwIcon className="size-3.5" />
            Reset chat
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Messages container */}
        <div
          aria-live="polite"
          aria-busy={isPending}
          className="max-h-[36rem] min-h-64 sm:min-h-80 space-y-4 overflow-y-auto rounded-2xl border border-dashed bg-muted/20 p-3.5 sm:p-5"
        >
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="size-6" />
              </div>
              <h3 className="text-base font-semibold">Ask anything about this codebase</h3>
              <p className="max-w-md text-xs sm:text-sm text-muted-foreground">
                Get context-aware explanations, trace function calls, locate bugs, or understand the
                architecture.
              </p>

              {/* Starter prompt chips */}
              <div className="pt-3 w-full max-w-xl">
                <p className="text-xs font-medium text-muted-foreground mb-2">Suggested prompts:</p>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            conversation.map((entry, index) => (
              <article
                key={`${entry.role}-${index}`}
                className={
                  entry.role === "user"
                    ? "ml-auto max-w-[90%] sm:max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm"
                    : "mr-auto max-w-[98%] sm:max-w-[90%] space-y-3 rounded-2xl border bg-card px-4 py-3.5 shadow-sm"
                }
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    {entry.role === "user" ? "You" : "CodeLens Assistant"}
                  </span>
                  {entry.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => handleCopyAnswer(entry.content, index)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Copy answer"
                    >
                      {copiedIndex === index ? (
                        <CheckIcon className="size-3.5 text-emerald-500" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <FormattedContent content={entry.content} />

                {entry.role === "assistant" && entry.searchMode === "keyword" && (
                  <div
                    role="status"
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
                  >
                    Semantic retrieval is temporarily unavailable. This answer uses keyword matches
                    only and may miss related code.
                  </div>
                )}

                {entry.role === "assistant" && entry.sources.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-3 text-xs">
                    <p className="mb-2 font-medium flex items-center gap-1.5 text-foreground">
                      <FileCodeIcon className="size-3.5 text-primary" />
                      Referenced Sources ({entry.sources.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.sources.map((source) => (
                        <Badge
                          key={source.chunkId}
                          variant="secondary"
                          className="font-mono text-[11px] font-normal py-1 px-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {source.filePath}:{source.startLine}-{source.endLine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}

          {isPending && (
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 text-xs sm:text-sm text-muted-foreground shadow-sm">
              <Spinner />
              <span>Analyzing codebase vectors and generating answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this repository... (e.g. How does error handling work?)"
            aria-label="Message CodeLens AI"
            maxLength={5000}
            className="min-h-16 resize-none text-sm"
            disabled={isPending}
          />
          <Button
            type="submit"
            size="default"
            aria-label="Send message"
            disabled={isPending || !message.trim()}
            className="w-full sm:w-auto h-12 px-5 gap-1.5 shadow-sm"
          >
            {isPending ? <Spinner /> : <SendIcon className="size-4" />}
            <span className="sm:inline">Send</span>
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground">
          Tip: Press Enter to send, Shift+Enter for newline.
        </p>
      </CardContent>
    </Card>
  );
}
