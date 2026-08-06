"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-center text-black">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          An unexpected error occurred. Our team has been notified — please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
