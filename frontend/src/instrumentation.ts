import * as Sentry from "@sentry/nextjs";

// Server/edge-side Sentry init. Next.js calls `register()` once when the server
// runtime boots. We initialize only when a DSN is present AND we are running in a
// server runtime (nodejs or edge). This file lives in `src/` because the app router
// lives at `src/app/`, so Next looks for `src/instrumentation.ts`.
//
// Strict NO-OP when no DSN is set.
export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (dsn && (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge")) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  }
}

// Capture errors thrown during server-side rendering / request handling.
// This is a no-op until Sentry.init() has run (i.e. when a DSN is configured).
export const onRequestError = Sentry.captureRequestError;
