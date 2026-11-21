// src/components/admin/AdminListPage.tsx  (new, server component)
// The four list pages (total / assigned / in progress / resolved) all use this.
import { getComplaintsAdmin } from "@/actions/adminActions";
import { getDepartmentOptions } from "@/features/admin/adminData";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { ComplaintList, type ListKind } from "./ComplaintList";

const LIST_KEY = { total: "total", assigned: "assigned", progress: "in_progress", resolved: "resolved" } as const;

export async function AdminListPage({ kind, searchParams }: { kind: ListKind; searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const q = param(sp.q)?.trim() || undefined;
  const sort = param(sp.sort) === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Math.floor(Number(param(sp.page)) || 1));
  const deptNum = Number(param(sp.dept));
  const departmentId = Number.isInteger(deptNum) && deptNum > 0 ? deptNum : undefined;

  const [res, departments] = await Promise.all([
    getComplaintsAdmin(LIST_KEY[kind], { departmentId, search: q, sort, page }),
    getDepartmentOptions(),
  ]);

  const data = res.success && "rows" in res ? res : null;
  return (
    <ComplaintList
      kind={kind}
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      statusTotal={data?.statusTotal ?? 0}
      page={data?.page ?? 1}
      totalPages={data?.totalPages ?? 1}
      departments={departments}
      filters={{ q: q ?? "", dept: departmentId ? String(departmentId) : "", sort }}
      loadError={data ? null : (res.message ?? null)}
    />
  );
}