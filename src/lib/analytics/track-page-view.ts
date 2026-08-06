/**
 * Fire-and-forget page-view beacon. `keepalive` keeps the request alive if
 * the tab navigates away immediately after this fires, without needing the
 * Beacon API's more restrictive body/header constraints.
 */
export function trackPageView(path: string, postId?: string) {
  const body = JSON.stringify({
    path,
    postId,
    referrer: document.referrer || undefined,
  });

  fetch("/api/views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
