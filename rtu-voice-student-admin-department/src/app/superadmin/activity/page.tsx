import { getActivityLog } from "@/actions/superAdminActions";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { ActivityLogView } from "./ActivityLogView";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; role?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const role = sp.role === "admin" || sp.role === "department" ? sp.role : undefined;

  const res = await getActivityLog({ search: sp.q, action: sp.action, role, page });

  return (
    <ActivityLogView
      rows={res.success ? res.rows : []}
      total={res.success ? res.total : 0}
      overallTotal={res.success ? res.overallTotal : 0}
      page={res.success ? res.page : page}
      pageSize={PAGE_SIZE}
      error={res.success ? null : res.message}
    />
  );
}