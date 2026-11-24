import { Suspense } from "react";
import { getComplaintsDepartment } from "@/actions/departmentActions";
import { getComplaintCounts } from "@/actions/sharedActions";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { LIST_KEY, STATUS_TO_KIND } from "@/features/department/departmentUi";
import { DepartmentDashboard } from "@/components/department/DepartmentQueue";

export default async function DepartmentDashboardPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const q = param(sp.q)?.trim() || undefined;
  const status = param(sp.status) ?? "";
  const page = Math.max(1, Math.floor(Number(param(sp.page))) || 1);
  const kind = STATUS_TO_KIND[status] ?? "total";

  const [counts, list] = await Promise.all([
    getComplaintCounts(),
    getComplaintsDepartment(LIST_KEY[kind], { search: q, sort: "newest", page }),
  ]);

  return (
    <Suspense>
      <DepartmentDashboard
        counts={counts.success && "counts" in counts ? (counts.counts as unknown as Record<string, number>) : null}
        rows={list.success && "rows" in list ? list.rows : []}
        total={list.success && "total" in list ? list.total : 0}
        loadError={list.success ? null : list.message}
        filters={{ q: q ?? "", status: STATUS_TO_KIND[status] ? status : "", page }}
      />
    </Suspense>
  );
}