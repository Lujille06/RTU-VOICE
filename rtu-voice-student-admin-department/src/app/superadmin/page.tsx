import { getAvailableDepartments, getStaffAccounts } from "@/actions/superAdminActions";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { AccountsView } from "./AccountsView";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const role = sp.role === "admin" || sp.role === "department" ? sp.role : undefined;
  const isActive = sp.status === "all" ? undefined : sp.status === "inactive" ? false : true; // active by default

  const [list, depts] = await Promise.all([
    getStaffAccounts({ search: sp.q, role, isActive, page }),
    getAvailableDepartments(),
  ]);

  return (
    <AccountsView
      rows={list.success ? list.rows : []}
      total={list.success ? list.total : 0}
      overallTotal={list.success ? list.overallTotal : 0}
      page={list.success ? list.page : page}
      pageSize={PAGE_SIZE}
      departments={depts.success ? depts.departments : []}
      error={list.success ? null : list.message}
    />
  );
}