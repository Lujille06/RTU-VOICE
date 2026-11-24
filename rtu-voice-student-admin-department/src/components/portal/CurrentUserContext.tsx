"use client";
// src/components/portal/CurrentUserContext.tsx
// Makes the real logged-in user (from the server) available to client components,
// replacing `session` from the demo store.
import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "@/features/auth/guards";

const Ctx = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(Ctx);
  if (!user) throw new Error("useCurrentUser must be used inside <CurrentUserProvider>");
  return user;
}

/** Like useCurrentUser, but returns null outside a portal (public pages, root error screens) instead of throwing. */
export function useOptionalCurrentUser(): CurrentUser | null {
  return useContext(Ctx);
}