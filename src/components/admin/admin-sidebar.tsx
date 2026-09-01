"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
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
  UserCogIcon,
  MegaphoneIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

// Oversight-only sections (taxonomy management, newsletter, SEO) are hidden
// from AUTHOR/CONTRIBUTOR — they only manage their own posts. `roles`
// omitted means every staff role can see the item.
const EDITORIAL: Role[] = [Role.ADMIN, Role.EDITOR];
const ADMIN_ONLY: Role[] = [Role.ADMIN];

const NAV = [
  { section: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon }] },
  {
    section: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileTextIcon },
      { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon, roles: EDITORIAL },
      { href: "/admin/tags", label: "Tags", icon: TagIcon, roles: EDITORIAL },
      { href: "/admin/authors", label: "Authors", icon: UsersIcon, roles: EDITORIAL },
      { href: "/admin/banners", label: "Banners", icon: MegaphoneIcon, roles: EDITORIAL },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    section: "Engagement",
    items: [
      { href: "/admin/comments", label: "Comments", icon: MessageSquareIcon },
      { href: "/admin/newsletter", label: "Newsletter", icon: MailIcon, roles: EDITORIAL },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3Icon },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/seo", label: "SEO Dashboard", icon: SearchIcon, roles: EDITORIAL },
      { href: "/admin/team", label: "Team", icon: UserCogIcon, roles: ADMIN_ONLY },
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon, roles: ADMIN_ONLY },
    ],
  },
];

export function AdminSidebar({ role, collapsed = false }: { role: Role; collapsed?: boolean }) {
  const pathname = usePathname();
  const nav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !("roles" in item) || item.roles?.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      aria-hidden={collapsed}
      inert={collapsed || undefined}
      className={cn(
        "border-sidebar-border bg-sidebar sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-0 border-r-0" : "w-64",
      )}
    >
      <div className="flex h-16 w-64 shrink-0 items-center gap-2.5 border-b px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="rounded-md bg-white px-1.5 py-1">
            <Image src={siteConfig.logo} alt={siteConfig.shortName} width={73} height={24} className="block" />
          </span>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">CMS</span>
        </Link>
      </div>

      <nav className="w-64 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {nav.map((group) => (
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
                        ? "bg-primary text-primary-foreground shadow-sm"
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
