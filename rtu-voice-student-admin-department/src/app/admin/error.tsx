"use client";

import { RouteError } from "@/components/RouteStates";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} retry={reset} />;
}