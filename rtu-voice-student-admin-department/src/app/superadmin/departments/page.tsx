import type { Metadata } from "next";
import { getDepartmentAccounts } from "@/actions/superAdminActions";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { DepartmentsView } from "./DepartmentsView";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // no status filter: deactivated departments stay listed so they can be reactivated
  const res = await getDepartmentAccounts({ page });

  return (
    <DepartmentsView
      rows={res.success ? res.rows : []}
      total={res.success ? res.total : 0}
      overallTotal={res.success ? res.overallTotal : 0}
      page={res.success ? res.page : page}
      pageSize={PAGE_SIZE}
      error={res.success ? null : res.message}
    />
  );
}
