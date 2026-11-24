// src/app/superadmin/layout.tsx
import type { ReactNode } from "react";
import { SuperadminShell } from "@/components/admin/SuperadminShell";
import { CurrentUserProvider } from "@/components/portal/CurrentUserContext";
import { requireRole } from "@/features/auth/guards";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("superadmin"); 
  return (
    <CurrentUserProvider user={user}>
      <SuperadminShell>{children}</SuperadminShell>
    </CurrentUserProvider>
  );
}