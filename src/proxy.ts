import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPublicApiRoute = createRouteMatcher([
  "/api/views(.*)",
  "/api/newsletter(.*)",
  "/api/search(.*)",
  "/api/og(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Fine-grained role authorization happens in the admin layout (server-side,
    // against Postgres) — middleware only guarantees "is authenticated" cheaply
    // at the edge, avoiding a DB round-trip on every request.
  }

  if (!isPublicApiRoute(req)) {
    // no-op: reserved for future rate limiting / CSRF hooks on mutating routes
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
