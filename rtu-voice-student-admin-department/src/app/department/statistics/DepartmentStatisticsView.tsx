"use client";

import { BarList, ChartCard, GroupedColumns, SERIES } from "@/components/admin/charts";
import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import type { DepartmentDashboardStats } from "@/features/department/departmentTypes";
import styles from "./statistics.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DepartmentStatisticsView({ stats }: { stats: DepartmentDashboardStats }) {
  const { kpis } = stats;
  const byPriority = stats.by_priority.map((r) => ({ label: r.name, value: r.count }));
  const monthly = stats.monthly.map((r) => ({
    label: MONTHS[new Date(r.month_start).getUTCMonth()] ?? r.month_start,
    values: [r.received, r.resolved],
  }));

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
        <h1 className={s.listTitle}>Statistics</h1>
        <p className={s.subtitle}>Statistics for your department only.</p>
      </div>

      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Total complaints</span>
          <span className={styles.tileValue}>{kpis.total}</span>
          <span className={styles.tileNote}>assigned to your department</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Resolved rate</span>
          <span className={styles.tileValue}>{kpis.resolve_rate}%</span>
          <span className={styles.tileNote}>{kpis.resolved} of {kpis.total} complaints</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Overdue now</span>
          <span className={styles.tileValue}>{kpis.overdue}</span>
          <span className={styles.tileNote}>{kpis.needs_attention} need attention in total</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Average time to resolve</span>
          <span className={styles.tileValue}>{kpis.avg_time_resolve ? `${kpis.avg_time_resolve.toFixed(1)}d` : "—"}</span>
          <span className={styles.tileNote}>from assignment to resolution</span>
        </li>
      </ul>

      <div className={styles.charts}>
        <ChartCard title="Priority levels" subtitle="Set by AI when a complaint is assigned" table={{ headers: ["Priority", "Complaints"], rows: byPriority.map((r) => [r.label, r.value]) }}>
          <BarList data={byPriority} />
        </ChartCard>
        <ChartCard
          title="Monthly trend"
          subtitle="Complaints received and resolved per month, last 6 months"
          legend={[{ label: "Received", color: SERIES[0] }, { label: "Resolved", color: SERIES[1] }]}
          table={{ headers: ["Month", "Received", "Resolved"], rows: monthly.map((r) => [r.label, ...r.values]) }}
        >
          <GroupedColumns data={monthly} series={["Received", "Resolved"]} />
        </ChartCard>
      </div>
    </div>
  );
}