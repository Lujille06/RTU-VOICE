// src/app/admin/statistics/page.tsx  (replaces page_e438ee.tsx)
import { getAdminDashboardStats } from "@/actions/adminActions";
import { getDepartmentOptions } from "@/features/admin/adminData";
import { param, type SearchParamsInput } from "@/features/admin/adminUi";
import { StatisticsView } from "./StatisticsView";

export default async function StatisticsPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const deptNum = Number(param(sp.dept));
  const deptId = Number.isInteger(deptNum) && deptNum > 0 ? deptNum : undefined;

  const [res, departments] = await Promise.all([getAdminDashboardStats(deptId), getDepartmentOptions()]);

  if (!res.success || !("stats" in res)) {
    return (
      <div className="container">
        <h1 className="page-title">Statistics</h1>
        <p className="alert alert-error" role="alert">
          {res.message || "Couldn't load the statistics. Please try again."}
        </p>
      </div>
    );
  }

  return <StatisticsView stats={res.stats} departments={departments} selectedDept={deptId ?? null} />;
}