import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/features/auth/guards";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  // not logged in -> /login; logged in as another role -> that role's home
  const user = await requireRole("student");
  return <PortalShell user={user}>{children}</PortalShell>;
}