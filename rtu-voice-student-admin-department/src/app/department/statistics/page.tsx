import type { Metadata } from "next";
import { getDepartmentDashboardStats } from "@/actions/departmentActions";
import { DepartmentStatisticsView } from "./DepartmentStatisticsView";

export const metadata: Metadata = { title: "Statistics" };

export default async function DepartmentStatisticsPage() {
  const res = await getDepartmentDashboardStats();

  if (!res.success || !("stats" in res)) {
    return (
      <div className="container">
        <h1 className="page-title">Statistics</h1>
        <p className="alert alert-error" role="alert">{res.message || "Couldn't load the statistics. Please try again."}</p>
      </div>
    );
  }
  return <DepartmentStatisticsView stats={res.stats} />;
}