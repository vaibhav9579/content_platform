import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { unsubscribeFromNewsletter } from "@/features/newsletter/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  const result = token ? await unsubscribeFromNewsletter(token) : { success: false as const, error: "Missing link." };

  return (
    <div className="container-wide flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      {result.success ? (
        <>
          <CheckCircle2Icon className="text-success size-10" />
          <h1 className="text-2xl font-semibold tracking-tight">You&apos;re unsubscribed</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            You won&apos;t receive any more new-post emails. You can re-subscribe any time from the site.
          </p>
        </>
      ) : (
        <>
          <XCircleIcon className="text-destructive size-10" />
          <h1 className="text-2xl font-semibold tracking-tight">Couldn&apos;t unsubscribe</h1>
          <p className="text-muted-foreground max-w-sm text-sm">{result.error}</p>
        </>
      )}
      <Button asChild className="mt-2">
        <Link href="/">Back to the homepage</Link>
      </Button>
    </div>
  );
}
