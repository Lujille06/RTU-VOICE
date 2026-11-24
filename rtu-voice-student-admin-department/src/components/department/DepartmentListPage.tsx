import { Suspense } from "react";
import { getComplaintsDepartment } from "@/actions/departmentActions";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { LIST_KEY, type DepartmentListKind } from "@/features/department/departmentUi";
import { DepartmentList } from "./DepartmentQueue";

export async function DepartmentListPage({ kind, searchParams }: { kind: DepartmentListKind; searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const q = param(sp.q)?.trim() || undefined;
  const sort = param(sp.sort) === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Math.floor(Number(param(sp.page))) || 1);

  const res = await getComplaintsDepartment(LIST_KEY[kind], { search: q, sort, page });
  const ok = res.success && "rows" in res;

  return (
    <Suspense>
      <DepartmentList
        kind={kind}
        rows={ok ? res.rows : []}
        total={ok ? res.total : 0}
        statusTotal={ok ? res.statusTotal : 0}
        loadError={res.success ? null : res.message}
        filters={{ q: q ?? "", sort, page }}
      />
    </Suspense>
  );
}