"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, SparklesIcon } from "lucide-react";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname.startsWith("/dashboard")) {
      return [{ label: "Dashboard", href: "/dashboard", isCurrent: true }];
    }
    if (pathname.startsWith("/repository/")) {
      return [
        { label: "Repositories", href: "/repositories", isCurrent: false },
        { label: "Details", href: pathname, isCurrent: true },
      ];
    }
    if (pathname.startsWith("/repositories")) {
      return [{ label: "Repositories", href: "/repositories", isCurrent: true }];
    }
    if (pathname.startsWith("/chat")) {
      return [{ label: "Chat", href: "/chat", isCurrent: true }];
    }
    if (pathname.startsWith("/settings")) {
      return [{ label: "Settings", href: "/settings", isCurrent: true }];
    }
    return [{ label: "CodeLens", href: "/dashboard", isCurrent: true }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4 data-[orientation=vertical]:h-4" />

          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={crumb.href} className="flex items-center gap-1">
                  {index > 0 && <ChevronRightIcon className="size-3.5 text-muted-foreground/60" />}
                  {isLast ? (
                    <span className="font-semibold text-foreground">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground"
            render={<Link href="/chat" />}
          >
            <SparklesIcon className="size-3.5 text-primary mr-1" />
            AI Chat
          </Button>

          <ModeToggle />

          <Separator orientation="vertical" className="h-4 data-[orientation=vertical]:h-4" />

          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
