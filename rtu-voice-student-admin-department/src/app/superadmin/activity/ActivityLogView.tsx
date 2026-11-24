"use client";

import { EmptyState, Pager, SearchBox, adminStyles as s } from "@/components/admin/bits";
import { useDebouncedSearch, useUrlFilters } from "@/components/admin/useUrlFilters";
import type { ActivityLogRow } from "@/features/superAdmin/superAdminTypes";
import { formatLongDate, formatTime } from "@/lib/format";
import styles from "./activity.module.css";

// These values must match the names in your `actions` table (run: select * from actions;).
const ACTION_OPTIONS = [
  { value: "department_assigned", label: "Assigned" },
  { value: "department_reassigned", label: "Reassigned" },
  { value: "complaint_rejected", label: "Rejected" },
  { value: "complaint_returned", label: "Returned" },
  { value: "status_changed", label: "Status changed" },
];
const ACTION_CLASS: Record<string, string> = {
  department_assigned: styles.aAssigned,
  department_reassigned: styles.aReassigned,
  complaint_rejected: styles.aRejected,
  complaint_returned: styles.aReturned,
  status_changed: styles.aStatus,
};
const prettify = (v: string) => {
  const t = v.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Superadmin Portal › Activity Log: changes made by admins and departments. */
export function ActivityLogView({
  rows,
  total,
  overallTotal,
  page,
  pageSize,
  error,
}: {
  rows: ActivityLogRow[];
  total: number;
  overallTotal: number;
  page: number;
  pageSize: number;
  error: string | null;
}) {
  const { params, update, pending } = useUrlFilters();
  const action = params.get("action") ?? "";
  const role = params.get("role") ?? "";
  const [query, setQuery] = useDebouncedSearch(params.get("q") ?? "", (v) => update({ q: v, page: 1 }));
  const filtered = Boolean(query || action || role);

  return (
    <div className="container">
      <div className={s.head}>
        <div className={s.listTitleRow}>
          <h1 className="page-title">Activity Log</h1>
          <span className={`${s.countPill} ${s.pillTotal}`}>{overallTotal}</span>
        </div>
        <p className={s.subtitle}>Assignments, reassignments, returns, rejections and status changes made by administrators and departments.</p>
      </div>

      <section className={s.panel} aria-label="Activity log" aria-busy={pending} style={{ opacity: pending ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} />
          <select aria-label="Filter by action" className={`select ${s.filter}`} value={action} onChange={(e) => update({ action: e.target.value, page: 1 })}>
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by actor" className={`select ${s.filter}`} value={role} onChange={(e) => update({ role: e.target.value, page: 1 })}>
            <option value="">Admins and departments</option>
            <option value="admin">Admins only</option>
            <option value="department">Departments only</option>
          </select>
        </div>

        {error ? (
          <p className="alert alert-error" role="alert" style={{ margin: 16 }}>
            {error}
          </p>
        ) : null}

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Activity log</caption>
            <thead>
              <tr>
                <th scope="col">Date &amp; time</th>
                <th scope="col">Tracking ID</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Department</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td data-label="Date & time" className={s.date}>
                    {formatLongDate(a.created_at)}
                    <span className={styles.time}>{formatTime(a.created_at)}</span>
                  </td>
                  <td data-label="Tracking ID" className={s.strong}>
                    {a.tracking_id}
                  </td>
                  <td data-label="Actor">
                    <span className={s.strong}>{a.actor_name}</span>
                    <span className={styles.role}>{prettify(a.actor_role)}</span>
                  </td>
                  <td data-label="Action">
                    <span className={`${s.pill} ${ACTION_CLASS[a.action] ?? styles.aStatus}`}>
                      {ACTION_OPTIONS.find((o) => o.value === a.action)?.label ?? prettify(a.action)}
                    </span>
                  </td>
                  <td data-label="Department">{a.department ?? "—"}</td>
                  <td data-label="Details" className={styles.detail}>
                    {a.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !error ? (
            <EmptyState
              message={filtered ? "No activity matches these filters." : "No activity yet."}
              action={
                filtered
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setQuery("");
                        update({ q: "", action: "", role: "", page: 1 });
                      },
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
        <Pager page={page} pageSize={pageSize} total={total} onPage={(p) => update({ page: p })} />
      </section>
    </div>
  );
}