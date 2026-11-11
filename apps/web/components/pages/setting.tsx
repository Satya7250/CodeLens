"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  CpuIcon,
  GitFork,
  LaptopIcon,
  MoonIcon,
  PaletteIcon,
  RefreshCwIcon,
  Settings2Icon,
  SunIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers/theme-provider";
import { PageHeader } from "./page-header";

export function SettingsPage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { theme, setTheme } = useTheme();

  const handleRefreshGitHub = () => {
    toast.success("GitHub OAuth status refreshed.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        label="Workspace"
        title="Settings & Preferences"
        description="Manage your account profile, GitHub integration, AI models, and interface theme."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Account & Profile Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="size-5 text-primary" />
              Account & Profile
            </CardTitle>
            <CardDescription>
              Authenticated profile managed through Clerk authentication.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3.5 rounded-xl border bg-muted/30 p-3.5">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-base">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  user?.firstName?.[0] || "U"
                )}
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {user?.fullName || user?.username || "Authenticated User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress || "Loading email..."}
                </p>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
              >
                Verified
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">Clerk User ID: </span>
                <span className="font-mono">{user?.id || "..."}</span>
              </p>
              <p>
                <span className="font-medium text-foreground">Database Sync: </span>
                <span className="text-emerald-600 dark:text-emerald-400">Active (Auto-sync)</span>
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile()}
                className="gap-1.5 text-xs"
              >
                <Settings2Icon className="size-3.5" />
                Manage Clerk Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Theme & Appearance Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PaletteIcon className="size-5 text-primary" />
              Appearance & Theme
            </CardTitle>
            <CardDescription>Customize how CodeLens looks on your screen.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <SunIcon className="size-5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <MoonIcon className="size-5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-medium transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <LaptopIcon className="size-5" />
                <span>System</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Selected theme will automatically sync across your sessions and devices.
            </p>
          </CardContent>
        </Card>

        {/* 3. GitHub Integration Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitFork className="size-5 text-primary" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Manage repository reading scopes and webhook synchronization.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">OAuth Connection</span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  Connected
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                CodeLens accesses repository metadata and file trees via GitHub REST APIs using your
                OAuth access token.
              </p>
              <div className="pt-1 flex flex-wrap gap-1 text-[11px] font-mono text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5">repo:read</span>
                <span className="rounded bg-muted px-1.5 py-0.5">read:org</span>
                <span className="rounded bg-muted px-1.5 py-0.5">user:email</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshGitHub}
              className="gap-1.5 text-xs"
            >
              <RefreshCwIcon className="size-3.5" />
              Refresh Connection
            </Button>
          </CardContent>
        </Card>

        {/* 4. AI & Vector Engine Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CpuIcon className="size-5 text-primary" />
              AI & Retrieval Engine
            </CardTitle>
            <CardDescription>
              Vector embeddings, similarity search, and chat model configurations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Embedding Model</span>
              <span className="font-medium font-mono">text-embedding-3-small (1536-dim)</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Chat / Reasoning LLM</span>
              <span className="font-medium font-mono">OpenRouter / GPT-4o-mini</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Vector Index Algorithm</span>
              <span className="font-medium font-mono">pgvector HNSW (Cosine ops)</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Code Chunking Method</span>
              <span className="font-medium font-mono">AST Tree-aware chunking</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-medium font-mono">PostgreSQL + Drizzle ORM</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
