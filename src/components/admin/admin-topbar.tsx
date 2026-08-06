import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PlusIcon } from "lucide-react";
import type { User } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AdminTopbar({ user }: { user: User }) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-md">
      <div>
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
