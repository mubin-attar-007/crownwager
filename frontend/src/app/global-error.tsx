"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm opacity-70">A critical error occurred. Please reload the page.</p>
        <button
          onClick={() => reset()}
          className="rounded-md border px-4 py-2 text-sm font-medium transition hover:opacity-80"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
