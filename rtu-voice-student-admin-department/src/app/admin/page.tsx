// src/app/admin/page.tsx  (replaces page_7af35e.tsx)
import { Suspense } from "react";
import { getMasterTrackingQueue, getPendingComplaints } from "@/actions/adminActions";
import { getComplaintCounts } from "@/actions/sharedActions";
import { MASTER_STATUSES } from "@/features/admin/adminTypes";
import { getDepartmentOptions } from "@/features/admin/adminData";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const tab = param(sp.tab) === "master" ? "master" : "pending";
  const q = param(sp.q)?.trim() || undefined;
  const sort = param(sp.sort) === "oldest" ? "oldest" : "newest";
  const status = MASTER_STATUSES.find((s) => s === param(sp.status));
  const deptNum = Number(param(sp.dept));
  const department_id = Number.isInteger(deptNum) && deptNum > 0 ? deptNum : undefined;

  // the tab you are on is filtered; the other one is loaded unfiltered just for its count
  const [counts, pending, master, departments] = await Promise.all([
    getComplaintCounts(),
    getPendingComplaints(tab === "pending" ? { search: q, sort } : {}),
    getMasterTrackingQueue(tab === "master" ? { search: q, status, department_id } : {}),
    getDepartmentOptions(),
  ]);

  const loadError = !pending.success ? pending.message : !master.success ? master.message : null;

  return (
    <Suspense>
      <AdminDashboard
        tab={tab}
        counts={counts.success && "counts" in counts ? (counts.counts as unknown as Record<string, number>) : null}
        pending={pending.pending_complaints ?? []}
        master={master.ongoing_complaints ?? []}
        departments={departments}
        loadError={loadError}
        filters={{ q: q ?? "", sort, status: status ?? "", dept: department_id ? String(department_id) : "" }}
      />
    </Suspense>
  );
}