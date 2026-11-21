"use client";
// src/app/admin/statistics/StatisticsView.tsx  (new: the page UI, now fed by getAdminDashboardStats)

import { useRouter } from "next/navigation";
import { BarList, ChartCard, GroupedColumns, SERIES } from "@/components/admin/charts";
import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import type { AdminDashboardStats } from "@/features/admin/adminTypes";
import type { DepartmentOption } from "@/features/admin/adminUi";
import styles from "./statistics.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function StatisticsView({
  stats,
  departments,
  selectedDept,
}: {
  stats: AdminDashboardStats;
  departments: DepartmentOption[];
  selectedDept: number | null;
}) {
  const router = useRouter();
  const deptName = selectedDept ? departments.find((d) => d.id === selectedDept)?.name : undefined;
  const dept = Boolean(selectedDept);

  const { kpis } = stats;
  const byCategory = stats.by_category.map((r) => ({ label: r.name, value: r.count })); // already sorted high to low
  const byDepartment = stats.by_department.map((r) => ({ label: r.name, value: r.count }));
  const byPriority = stats.by_priority.map((r) => ({ label: r.name, value: r.count }));
  // month_start is a date like 2026-06-01; read it as UTC so the month never shifts
  const monthly = stats.monthly.map((r) => ({
    label: MONTHS[new Date(r.month_start).getUTCMonth()] ?? r.month_start,
    values: [r.submitted, r.resolved],
  }));
  const topCategory = byCategory[0];
  const topDepartment = byDepartment[0];

  const onDept = (value: string) => router.replace(value ? `?dept=${encodeURIComponent(value)}` : "?", { scroll: false });

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <h1 className={s.listTitle}>Statistics</h1>
        <p className={s.subtitle}>
          {dept ? `Department-level statistics for ${deptName ?? "this department"}.` : "Campus-wide complaint statistics. Choose a department to narrow them down."}
        </p>
      </div>

      <div className={styles.filterRow}>
        <label htmlFor="stats-dept" className={styles.filterLabel}>
          Department
        </label>
        <select id="stats-dept" className={`select ${s.filter}`} value={selectedDept ? String(selectedDept) : ""} onChange={(e) => onDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>{dept ? "Complaints routed" : "Total complaints"}</span>
          <span className={styles.tileValue}>{kpis.total}</span>
          <span className={styles.tileNote}>{dept ? "assigned to this department" : "including pending and rejected"}</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Resolve rate</span>
          <span className={styles.tileValue}>{kpis.resolve_rate}%</span>
          <span className={styles.tileNote}>
            {kpis.resolved} of {kpis.approved} approved complaints
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Overdue now</span>
          <span className={styles.tileValue}>{kpis.overdue}</span>
          <span className={styles.tileNote}>past the resolve-within target</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Average time to resolve</span>
          <span className={styles.tileValue}>{kpis.avg_time_resolve ? `${kpis.avg_time_resolve.toFixed(1)}d` : "—"}</span>
          <span className={styles.tileNote}>from assignment to resolution</span>
        </li>
      </ul>

      <div className={styles.charts}>
        <ChartCard
          title="Complaints by category"
          subtitle={topCategory?.value ? `Top category: ${topCategory.label}` : undefined}
          table={{ headers: ["Category", "Complaints"], rows: byCategory.map((d) => [d.label, d.value]) }}
        >
          <BarList data={byCategory} />
        </ChartCard>

        {dept ? (
          <ChartCard
            title="Priority levels"
            subtitle="Set by AI when a complaint is assigned"
            table={{ headers: ["Priority", "Complaints"], rows: byPriority.map((d) => [d.label, d.value]) }}
          >
            <BarList data={byPriority} />
          </ChartCard>
        ) : (
          <ChartCard
            title="Complaints by department"
            subtitle={topDepartment?.value ? `Top department: ${topDepartment.label}` : undefined}
            table={{ headers: ["Department", "Complaints"], rows: byDepartment.map((d) => [d.label, d.value]) }}
          >
            <BarList data={byDepartment} />
          </ChartCard>
        )}

        <ChartCard
          title="Monthly trend"
          subtitle="Complaints submitted and resolved per month, last 6 months"
          legend={[
            { label: "Submitted", color: SERIES[0] },
            { label: "Resolved", color: SERIES[1] },
          ]}
          table={{ headers: ["Month", "Submitted", "Resolved"], rows: monthly.map((m) => [m.label, ...m.values]) }}
        >
          <GroupedColumns data={monthly} series={["Submitted", "Resolved"]} />
        </ChartCard>

        {dept ? null : (
          <ChartCard
            title="Priority levels"
            subtitle="Set by AI when a complaint is assigned"
            table={{ headers: ["Priority", "Complaints"], rows: byPriority.map((d) => [d.label, d.value]) }}
          >
            <BarList data={byPriority} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}