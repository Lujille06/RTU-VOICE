// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CurrentUserProvider } from "@/components/portal/CurrentUserContext";
import { requireRole } from "@/features/auth/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // not logged in -> /login; another role -> that role home
  const user = await requireRole("admin");
  return (
    <CurrentUserProvider user={user}>
      <AdminShell>{children}</AdminShell>
    </CurrentUserProvider>
  );
}
