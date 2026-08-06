"use client";

import * as React from "react";

import { recordView } from "@/features/analytics/actions";

function getVisitorId() {
  const key = "cp_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function ViewTracker({ postId, slug, title }: { postId: string; slug: string; title: string }) {
  React.useEffect(() => {
    const visitorId = getVisitorId();
    recordView(postId, visitorId, document.referrer || undefined, navigator.userAgent);

    try {
      const key = "cp_recently_viewed";
      const raw = localStorage.getItem(key);
      const list: { slug: string; title: string; viewedAt: number }[] = raw ? JSON.parse(raw) : [];
      const next = [{ slug, title, viewedAt: Date.now() }, ...list.filter((i) => i.slug !== slug)].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage unavailable — non-critical
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, slug]);

  return null;
}
