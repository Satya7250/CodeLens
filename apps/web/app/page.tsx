import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BotIcon,
  Code2Icon,
  DatabaseIcon,
  FolderGit2Icon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <SparklesIcon className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">CodeLens</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
            {userId ? (
              <Button
                size="sm"
                render={<Link href="/dashboard" />}
                className="gap-1.5 shadow-sm text-xs sm:text-sm"
              >
                <span>Dashboard</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/sign-in" />}
                  className="text-xs sm:text-sm"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  render={<Link href="/sign-up" />}
                  className="gap-1.5 shadow-sm text-xs sm:text-sm"
                >
                  <span>Get Started</span>
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <SparklesIcon className="size-3.5 text-primary" />
            <span className="font-medium text-foreground">AI Codebase Intelligence</span>
            <span>·</span>
            <span>Vector RAG with AST Chunking</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight sm:leading-tight">
            Understand any codebase in{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-purple-600 bg-clip-text text-transparent">
              seconds, not weeks
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-muted-foreground leading-relaxed">
            Connect your GitHub repositories, extract syntax-aware AST chunks, and ask complex
            questions grounded in real code with exact file and line citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              render={<Link href={userId ? "/dashboard" : "/sign-up"} />}
              className="w-full sm:w-auto h-11 px-6 gap-2 shadow-md"
            >
              <ZapIcon className="size-4" />
              <span>{userId ? "Go to Dashboard" : "Start Exploring for Free"}</span>
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href={userId ? "/repositories" : "/sign-in"} />}
              className="w-full sm:w-auto h-11 px-6 gap-2"
            >
              <FolderGit2Icon className="size-4" />
              <span>Connect Repositories</span>
            </Button>
          </div>

          {/* CodeLens Interactive App Mockup Preview */}
          <div className="mx-auto mt-12 max-w-5xl rounded-2xl border bg-card p-2 sm:p-4 shadow-xl">
            <div className="rounded-xl border bg-background overflow-hidden text-left">
              {/* Mock Window Header */}
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-red-500/80" />
                  <div className="size-3 rounded-full bg-yellow-500/80" />
                  <div className="size-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    CodeLens / facebook / react · main
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[11px]"
                >
                  Indexed · 1,420 chunks
                </Badge>
              </div>

              {/* Mock Window Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-border/60">
                <div className="p-4 space-y-3 bg-muted/10">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Codebase Search
                  </div>
                  <div className="rounded-lg border bg-background p-2.5 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
                    <SearchIcon className="size-3.5 text-primary shrink-0" />
                    <span>How does fiber reconciliation work?</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="rounded-lg border bg-card p-2 text-xs">
                      <p className="font-mono font-medium text-foreground text-[11px] truncate">
                        packages/react-reconciler/ReactFiberWorkLoop.js
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">
                        Lines 1240–1285 · 96% match
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-2 text-xs">
                      <p className="font-mono font-medium text-foreground text-[11px] truncate">
                        packages/react-reconciler/ReactFiberBeginWork.js
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">
                        Lines 840–890 · 91% match
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 sm:p-5 space-y-4">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      You
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-3 text-xs sm:text-sm">
                      Explain the scheduling loop in React Fiber and where work priorities are
                      determined.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                      AI
                    </div>
                    <div className="rounded-2xl border bg-card p-3.5 sm:p-4 text-xs sm:text-sm space-y-2.5 shadow-xs">
                      <p className="leading-relaxed">
                        In React Fiber, work is processed inside{" "}
                        <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-[11px]">
                          workLoopConcurrent
                        </code>{" "}
                        in <code className="font-mono text-xs">ReactFiberWorkLoop.js</code>. The
                        scheduler yields execution when the browser frame deadline is reached.
                      </p>
                      <div className="rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-100 overflow-x-auto">
                        <code>{`function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}`}</code>
                      </div>
                      <div className="border-t pt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="text-muted-foreground">Sources:</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          ReactFiberWorkLoop.js:1240-1285
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          SchedulerWithProgress.js:45-72
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Engineered for Developers
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              Everything you need to navigate, audit, and debug complex multi-language codebases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Code2Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-base">AST Chunking</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Parse TypeScript, Python, Go, Java, and Rust preserving function, class, and
                interface integrity.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DatabaseIcon className="size-5" />
              </div>
              <h3 className="font-semibold text-base">pgvector HNSW</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Vector similarity search with cosine distance indexing for sub-100ms retrieval on
                large repositories.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BotIcon className="size-5" />
              </div>
              <h3 className="font-semibold text-base">Source-Grounded Chat</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Chat with an AI that cites real line numbers and source files instead of
                hallucinating code.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <h3 className="font-semibold text-base">Secure GitHub OAuth</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Direct OAuth synchronization for public and private repositories without saving
                personal tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Three simple steps</h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              From zero to complete codebase understanding in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold">Connect Repository</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Select any repository from your GitHub account. CodeLens supports public and private
                repositories.
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold">Automatic Indexing</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                CodeLens fetches the repository tree, chunks code using tree-sitter AST rules, and
                generates 1536-dimensional embeddings.
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold">Search & Chat</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Perform natural language semantic searches or ask full questions in AI Chat with
                verified source references.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30 py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <span className="font-semibold text-foreground">CodeLens</span>
            <span>·</span>
            <span>AI Codebase Assistant</span>
          </div>
          <p>© {new Date().getFullYear()} CodeLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
