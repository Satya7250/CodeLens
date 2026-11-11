"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/dashboard/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

import {
  LayoutDashboardIcon,
  FolderGit2Icon,
  MessagesSquareIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon className="size-4" />,
    },
    {
      title: "Repositories",
      url: "/repositories",
      icon: <FolderGit2Icon className="size-4" />,
    },
    {
      title: "AI Chat",
      url: "/chat",
      icon: <MessagesSquareIcon className="size-4" />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon className="size-4" />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              className="flex items-center gap-2.5 p-1.5 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <SparklesIcon className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                  CodeLens
                </span>
                <span className="text-[11px] text-muted-foreground">AI Code Assistant</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div className="rounded-xl border border-sidebar-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">AI Engine</span>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-normal text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
            >
              Active
            </Badge>
          </div>
          <p className="text-[11px] leading-tight text-muted-foreground">
            pgvector HNSW + OpenRouter
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
