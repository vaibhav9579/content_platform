"use client";

import * as React from "react";
import type { User } from "@prisma/client";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  // Read the saved preference after mount rather than during initial render —
  // avoids a server/client hydration mismatch, at the cost of a brief flash
  // of the expanded sidebar on load for users who left it collapsed.
  React.useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="bg-muted/20 flex h-screen overflow-hidden">
      <AdminSidebar role={user.role} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar user={user} sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
