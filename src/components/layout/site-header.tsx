import Link from "next/link";
import Image from "next/image";
import { SignInButton, UserButton } from "@clerk/nextjs";

import { navConfig, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SearchTrigger } from "@/components/shared/search-trigger";
import { isStaffRole } from "@/lib/auth";
import { getCurrentDbUser } from "@/lib/auth";
import { LayoutDashboardIcon, BookmarkIcon } from "lucide-react";

export async function SiteHeader() {
  const user = await getCurrentDbUser().catch(() => null);

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-md bg-white px-2 py-1.5">
          <Image src={siteConfig.logo} alt={siteConfig.name} width={85} height={28} className="block" priority />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navConfig.main
            .filter((item) => item.href !== "/search")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.title}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <SearchTrigger />
          <ThemeToggle />
          {isStaffRole(user?.role) && (
            <Button variant="ghost" size="icon" asChild aria-label="Admin dashboard">
              <Link href="/admin/dashboard">
                <LayoutDashboardIcon className="size-4" />
              </Link>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="icon" asChild aria-label="My bookmarks">
              <Link href="/bookmarks">
                <BookmarkIcon className="size-4" />
              </Link>
            </Button>
          )}
          {user ? (
            <UserButton afterSwitchSessionUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
