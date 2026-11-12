"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
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

const markdownComponents: Components = {
  a({ href, children }) {
    const isExternal = href?.startsWith("https://") || href?.startsWith("http://");

    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  code({ className, children }) {
    return (
      <code
        className={`rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] ${className ?? ""}`}
      >
        {children}
      </code>
    );
  },
  h1({ children }) {
    return <h1 className="mb-3 mt-6 text-xl font-semibold tracking-tight">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-5 text-lg font-semibold tracking-tight">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>;
  },
  li({ children }) {
    return <li className="my-1 pl-1 leading-6">{children}</li>;
  },
  ol({ children }) {
    return <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>;
  },
  p({ children }) {
    return <p className="my-3 leading-7 first:mt-0 last:mb-0">{children}</p>;
  },
  pre({ children }) {
    const child = Children.toArray(children)[0];

    if (
      isValidElement<{ children?: ReactNode; className?: string }>(child) &&
      typeof child.props.children === "string"
    ) {
      const language = child.props.className?.match(/language-([\w-]+)/)?.[1];
      return <CodeBlock code={child.props.children.replace(/\n$/, "")} language={language} />;
    }

    return <pre className="my-3 overflow-x-auto rounded-xl bg-muted p-4 text-sm">{children}</pre>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    );
  },
  td({ children }) {
    return <td className="border-t px-3 py-2 align-top">{children}</td>;
  },
  th({ children }) {
    return <th className="bg-muted/70 px-3 py-2 font-semibold">{children}</th>;
  },
  ul({ children }) {
    return <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>;
  },
};

function linkCitations(content: string): string {
  return content
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part, index) =>
      index % 2 === 0 ? part.replace(/\[Source\s+(\d+)\]/gi, "[Source $1](#source-$1)") : part,
    )
    .join("");
}

function FormattedContent({ content }: { content: string }) {
  return (
    <div className="min-w-0 break-words text-sm text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {linkCitations(content)}
      </ReactMarkdown>
    </div>
  );
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
                    : "mr-auto w-full max-w-[98%] space-y-3 rounded-2xl border bg-card px-4 py-4 shadow-sm sm:px-5"
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
                  <section className="mt-4 border-t border-border/60 pt-3 text-xs">
                    <h3 className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                      <FileCodeIcon className="size-3.5 text-primary" />
                      Sources
                      <Badge variant="outline" className="ml-1">
                        {entry.sources.length}
                      </Badge>
                    </h3>
                    <ol className="grid gap-2 sm:grid-cols-2">
                      {entry.sources.map((source, sourceIndex) => (
                        <li
                          key={source.chunkId}
                          id={`source-${sourceIndex + 1}`}
                          className="flex min-w-0 items-start gap-2.5 rounded-xl border bg-muted/20 p-2.5"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {sourceIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="break-all font-mono text-[11px] text-foreground">
                              {source.filePath}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Lines {source.startLine}-{source.endLine}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
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
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive sm:text-sm"
          >
            <p className="font-semibold">We couldn't generate a reply</p>
            <p className="mt-1">{errorMessage}</p>
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
