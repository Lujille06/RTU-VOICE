import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPublicComplaints } from "@/actions/studentActions";
import { Icon } from "@/components/Icon";
import type { PublicConcern } from "@/features/student/studentTypes";
import { PublicDashboard } from "./PublicDashboard";

export default async function PublicDashboardPage() {
  const supabase = await createClient();

  const [res, { data: cats }] = await Promise.all([
    getPublicComplaints(0, "", ""),
    supabase.from("categories").select("category").order("id"),
  ]);

  // the action returns { success: false, message } (no rows) on failure: don't crash
  if (!res.success || !res.rows) {
    return (
      <div className="container">
        <div className="page-head">
          <h1 className="page-title">Public Dashboard</h1>
        </div>
        <div className="alert alert-warning" role="alert">
          <Icon name="alert-triangle" size={22} />
          <div>
            <strong>The public dashboard couldn&apos;t be loaded.</strong>
            <br />
            {res.message || "Please try again."}
          </div>
        </div>
      </div>
    );
  }

  const categories = (cats ?? []).map((c) => c.category as string);

  return (
    <Suspense>
      <PublicDashboard initialRows={res.rows as PublicConcern[]} total={res.total ?? 0} categories={categories} />
    </Suspense>
  );
}