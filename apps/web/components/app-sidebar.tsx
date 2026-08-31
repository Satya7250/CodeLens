"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CommandIcon,
  FolderGit2Icon,
  MessagesSquareIcon,
  Settings2Icon,
  WorkflowIcon,
} from "lucide-react";

const data = {
  navMain: [
    {
      title: "Repositories",
      url: "/repositories",
      icon: <FolderGit2Icon />,
    },
    {
      title: "Indexing",
      url: "/repositories",
      icon: <WorkflowIcon />,
    },
    {
      title: "Chat",
      url: "/chat",
      icon: <MessagesSquareIcon />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/repositories" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">CodeLens</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
