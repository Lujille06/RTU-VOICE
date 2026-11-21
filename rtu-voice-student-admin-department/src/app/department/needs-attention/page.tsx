import type { Metadata } from "next";
import { Suspense } from "react";
import { getDepartmentDashboardStats, getNeedsAttention } from "@/actions/departmentActions";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { NeedsAttention } from "@/components/department/DepartmentQueue";

export const metadata: Metadata = { title: "Needs attention" };

export default async function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const q = param(sp.q)?.trim() || undefined;
  const pr = Number(param(sp.priority));
  const priorityId = Number.isInteger(pr) && pr > 0 ? pr : undefined;
  const page = Math.max(1, Math.floor(Number(param(sp.page))) || 1);

  // the stats call is only used for the priority filter options (real ids, no guessing)
  const [res, stats] = await Promise.all([getNeedsAttention({ search: q, priorityId, page }), getDepartmentDashboardStats()]);
  const ok = res.success && "rows" in res;
  const priorities = stats.success && "stats" in stats ? stats.stats.by_priority.map((p) => ({ id: p.id, name: p.name })) : [];

  return (
    <Suspense>
      <NeedsAttention
        rows={ok ? res.rows : []}
        total={ok ? res.total : 0}
        overdueCount={ok ? res.overdueCount : 0}
        waitingCount={ok ? res.waitingCount : 0}
        badge={ok ? res.badge : 0}
        priorities={priorities}
        loadError={res.success ? null : res.message}
        filters={{ q: q ?? "", priority: priorityId ? String(priorityId) : "", page }}
      />
    </Suspense>
  );
}