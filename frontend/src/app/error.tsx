"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm opacity-70">
        An unexpected error occurred. Try again, and reload the page if it persists.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md border px-4 py-2 text-sm font-medium transition hover:opacity-80"
      >
        Try again
      </button>
    </div>
  );
}
