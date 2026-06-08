"use client";

import * as Sentry from "@sentry/nextjs";

// Client-side Sentry init. Next 15.1 does not support the `instrumentation-client.ts`
// convention (that is 15.3+), so we initialize from a "use client" component that is
// rendered in the root layout, ensuring it runs once on every page in the browser.
//
// This is a strict NO-OP when NEXT_PUBLIC_SENTRY_DSN is unset.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export default function SentryInit() {
  return null;
}
