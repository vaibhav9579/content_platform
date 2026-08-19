/**
 * Fire-and-forget page-view beacon. `keepalive` keeps the request alive if
 * the tab navigates away immediately after this fires, without needing the
 * Beacon API's more restrictive body/header constraints.
 */
export function trackPageView(path: string, postId?: string) {
  const params = new URLSearchParams(window.location.search);
  const body = JSON.stringify({
    path,
    postId,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  });

  fetch("/api/views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
