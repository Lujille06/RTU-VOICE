"use client";
// src/components/RouteStates.tsx

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { useOptionalCurrentUser } from "@/components/portal/CurrentUserContext";

// Mirrors ROLE_HOME in features/auth/guards.ts. That file is "server-only", so a client component can't import it.
const HOME_BY_ROLE = {
  student: "/dashboard",
  admin: "/admin",
  department: "/department",
  superadmin: "/superadmin", // lowercase: the folder is src/app/superadmin
} as const;

/**
 * Shown by the loading.tsx files while a route's code loads during navigation. It renders inside the
 * section's layout, so the header and menu stay on screen.
 */
export function RouteLoading({ label = "Loading…", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={`route-state ${compact ? "route-state-compact" : ""}`} role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Where "home" is for whoever is signed in (the landing page outside the portals). */
export function useHomeHref(): { href: string; label: string } {
  // the portal layouts put the real signed-in user in context; public pages have none
  const user = useOptionalCurrentUser();
  if (!user) return { href: "/", label: "Go to home page" };
  return { href: HOME_BY_ROLE[user.role], label: user.role === "student" ? "Go to dashboard" : "Go to your portal" };
}

/**
 * Shown by the error.tsx files when a page fails to render. "Try again" re-renders the page
 * (Next's retry()); the second button goes to the right home page for the signed-in role.
 */
export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const home = useHomeHref();
  useEffect(() => {
    // The browser console is the only log here; add a real error reporter if you want these tracked.
    console.error(error);
  }, [error]);

  return (
    <div className="route-state route-state-error" role="alert">
      <Icon name="alert-triangle" size={36} strokeWidth={1.8} />
      <h1 className="route-state-title">Something went wrong</h1>
      <p className="route-state-text">This page couldn&apos;t load. Try again, or go back to your home page.</p>
      <div className="route-state-actions">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          Try again
        </button>
        <Link href={home.href} className="btn btn-outline">
          {home.label}
        </Link>
      </div>
    </div>
  );
}