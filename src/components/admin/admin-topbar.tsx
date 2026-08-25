"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PlusIcon, PanelLeftIcon, BookOpenIcon } from "lucide-react";
import type { User } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AdminTopbar({
  user,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  user: User;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <header className="border-sidebar-border bg-sidebar/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          aria-pressed={sidebarCollapsed}
          className="hidden md:inline-flex"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
        <div className="bg-accent text-accent-foreground hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex">
          <BookOpenIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm leading-tight font-semibold">Welcome back, {firstName} 👋</p>
          <p className="text-muted-foreground hidden text-xs leading-tight sm:block">
            Here&apos;s what&apos;s happening with your publication today.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <PlusIcon /> New Post
          </Link>
        </Button>
        <ThemeToggle />
        <UserButton afterSwitchSessionUrl="/" />
      </div>
    </header>
  );
}
