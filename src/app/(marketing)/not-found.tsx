import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-wide flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-muted-foreground font-serif text-8xl font-semibold">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The article or page you&apos;re looking for may have moved or been unpublished.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/blog">Browse articles</Link>
        </Button>
      </div>
    </div>
  );
}
