"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  FolderTreeIcon,
  TagIcon,
  UsersIcon,
  ImageIcon,
  MailIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  BarChart3Icon,
  ExternalLinkIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const NAV = [
  { section: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon }] },
  {
    section: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileTextIcon },
      { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon },
      { href: "/admin/tags", label: "Tags", icon: TagIcon },
      { href: "/admin/authors", label: "Authors", icon: UsersIcon },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    section: "Engagement",
    items: [
      { href: "/admin/comments", label: "Comments", icon: MessageSquareIcon },
      { href: "/admin/newsletter", label: "Newsletter", icon: MailIcon },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3Icon },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/seo", label: "SEO Dashboard", icon: SearchIcon },
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export function AdminSidebar({ role, collapsed = false }: { role: Role; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      aria-hidden={collapsed}
      inert={collapsed || undefined}
      className={cn(
        "border-border bg-background sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-0 border-r-0" : "w-64",
      )}
    >
      <div className="flex h-16 w-64 shrink-0 items-center gap-2 border-b px-5">
        <Link href="/admin/dashboard" className="font-serif text-base font-semibold tracking-tight">
          {siteConfig.shortName} CMS
        </Link>
      </div>

      <nav className="w-64 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-muted-foreground px-3 pb-1.5 text-[11px] font-semibold tracking-wide uppercase">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="w-64 shrink-0 border-t p-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <ExternalLinkIcon className="size-4" /> View site
        </Link>
        <p className="text-muted-foreground px-3 pt-1 text-xs">Signed in as {role.toLowerCase()}</p>
      </div>
    </aside>
  );
}
