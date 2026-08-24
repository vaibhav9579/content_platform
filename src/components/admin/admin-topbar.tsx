"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PlusIcon, PanelLeftIcon } from "lucide-react";
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
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md">
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
        <p className="text-sm font-medium">Welcome back, {user.name?.split(" ")[0] ?? "there"}</p>
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
