// src/app/department/layout.tsx
import type { ReactNode } from "react";
import { DepartmentShell } from "@/components/department/DepartmentShell";
import { CurrentUserProvider } from "@/components/portal/CurrentUserContext";
import { requireRole } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function DepartmentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("department");

  // the department name goes in the header second line
  let departmentName: string | undefined;
  if (user.departmentId != null) {
    const supabase = await createClient();
    const { data } = await supabase.from("departments").select("name").eq("id", user.departmentId).maybeSingle();
    departmentName = data?.name ?? undefined;
  }

  return (
    <CurrentUserProvider user={user}>
      <DepartmentShell departmentName={departmentName}>{children}</DepartmentShell>
    </CurrentUserProvider>
  );
}