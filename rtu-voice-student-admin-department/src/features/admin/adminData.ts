// src/features/admin/adminData.ts  (new, server only)
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DepartmentOption } from "@/features/admin/adminUi";

// Departments for dropdowns (assign target + filters). Needs an RLS policy that lets admins read `departments`.
export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("id, name, is_active").order("name");
  if (error) {
    console.error("[getDepartmentOptions] failed:", error);
    return [];
  }
  return (data ?? []) as DepartmentOption[];
}