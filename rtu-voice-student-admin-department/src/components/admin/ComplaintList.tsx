"use client";
// src/components/admin/ComplaintList.tsx  (replaces the demo-store version)

import { useEffect, useState, type ReactNode } from "react";
import type { ComplaintRow } from "@/features/admin/adminTypes";
import { asPriority, asStatus, type DepartmentOption } from "@/features/admin/adminUi";
import { formatShortDate } from "@/lib/format";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { BackToDashboard, EmptyState, Pager, PriorityPill, SearchBox, StatusPill, adminStyles as s, colType } from "./bits";
import { useComplaintModals } from "./useComplaintModals";
import { useUrlFilters } from "./useUrlFilters";

export type ListKind = "total" | "assigned" | "progress" | "resolved";

interface Column {
  label: string;
  cell: (c: ComplaintRow) => ReactNode;
  className?: string | ((c: ComplaintRow) => string | undefined);
}

const CONFIG: Record<ListKind, { title: string; subtitle: string; pill: string }> = {
  total: { title: "Total complaints", subtitle: "Every complaint submitted to RTU Voice.", pill: s.pillTotal },
  assigned: { title: "Assigned", subtitle: "Complaints that have been assigned to a department.", pill: s.pillAssigned },
  progress: { title: "In progress", subtitle: "Complaints a department is currently working on.", pill: s.pillProgress },
  resolved: { title: "Resolved", subtitle: "Complaints that have been resolved.", pill: s.pillResolved },
};

// ADJUST: the SlaFields property names on ComplaintRow (see sharedTypes.ts). They are read here, in one place.
function sla(c: ComplaintRow) {
  const r = c as unknown as Record<string, unknown>;
  const str = (...keys: string[]) => {
    for (const k of keys) if (typeof r[k] === "string") return r[k] as string;
    return null;
  };
  return {
    assignedAt: str("assigned_at", "first_assigned_at"),
    acknowledgedAt: str("acknowledged_at"),
    acknowledgeBy: str("acknowledge_by", "acknowledge_due_at"),
    resolveBy: str("resolve_by", "resolve_due_at"),
    resolvedAt: str("resolved_at"),
    overdue: Boolean(r["is_overdue"] ?? r["overdue"]),
  };
}

const daysBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));

type Props = {
  kind: ListKind;
  rows: ComplaintRow[];
  total: number; // matches for the current search/filter
  statusTotal: number; // everything in this list, ignoring search (header badge)
  page: number;
  totalPages: number;
  departments: DepartmentOption[];
  filters: { q: string; dept: string; sort: "newest" | "oldest" };
  loadError: string | null;
};

/** Total complaints / Assigned / In progress / Resolved list pages. Data comes from the server; filters live in the URL. */
export function ComplaintList({ kind, rows, total, statusTotal, page, departments, filters, loadError }: Props) {
  const modals = useComplaintModals(departments);
  const { set } = useUrlFilters();
  const cfg = CONFIG[kind];

  const [query, setQuery] = useState(filters.q);
  useEffect(() => {
    if (query === filters.q) return;
    const t = setTimeout(() => set({ q: query.trim() || null, page: null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const idCell = (c: ComplaintRow) => (
    <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.tracking_id)}>
      {c.tracking_id}
    </button>
  );
  const dateCell = (iso: string | null) => (iso ? formatShortDate(iso) : "—");
  const dueCell = (iso: string | null, overdue: boolean) =>
    iso ? (
      <span className={overdue ? s.danger : undefined}>
        {formatShortDate(iso)}
        {overdue ? " · overdue" : ""}
      </span>
    ) : (
      "—"
    );
  const priorityCell = (c: ComplaintRow) => <PriorityPill priority={asPriority(c.priority_name)} />;
  const deptCell = (c: ComplaintRow) => c.department_name ?? "—";

  const columns: Column[] =
    kind === "total"
      ? [
          { label: "Date", cell: (c) => formatShortDate(c.created_at), className: s.date },
          { label: "Tracking ID", cell: idCell },
          { label: "Title", cell: (c) => c.title, className: s.strong },
          { label: "Category", cell: (c) => c.category_name },
          { label: "Department", cell: (c) => c.department_name ?? "Not assigned", className: (c) => (c.department_name ? undefined : s.muted) },
          { label: "Status", cell: (c) => <StatusPill status={asStatus(c.status_name)} /> },
        ]
      : kind === "assigned"
        ? [
            { label: "Assigned", cell: (c) => dateCell(sla(c).assignedAt), className: s.date },
            { label: "Tracking ID", cell: idCell },
            { label: "Title", cell: (c) => c.title, className: s.strong },
            { label: "Department", cell: deptCell },
            { label: "Priority", cell: priorityCell },
            { label: "Acknowledge by", cell: (c) => dueCell(sla(c).acknowledgeBy, false) },
            { label: "Resolve by", cell: (c) => dueCell(sla(c).resolveBy, sla(c).overdue) },
          ]
        : kind === "progress"
          ? [
              { label: "Assigned", cell: (c) => dateCell(sla(c).assignedAt), className: s.date },
              { label: "Tracking ID", cell: idCell },
              { label: "Title", cell: (c) => c.title, className: s.strong },
              { label: "Department", cell: deptCell },
              { label: "Priority", cell: priorityCell },
              { label: "Acknowledged", cell: (c) => dateCell(sla(c).acknowledgedAt) },
              { label: "Resolve by", cell: (c) => dueCell(sla(c).resolveBy, sla(c).overdue) },
            ]
          : [
              { label: "Resolved", cell: (c) => dateCell(sla(c).resolvedAt), className: s.date },
              { label: "Tracking ID", cell: idCell },
              { label: "Title", cell: (c) => c.title, className: s.strong },
              { label: "Department", cell: deptCell },
              { label: "Priority", cell: priorityCell },
              {
                label: "Resolved in",
                cell: (c) => {
                  const f = sla(c);
                  if (!f.assignedAt || !f.resolvedAt) return "—";
                  const n = daysBetween(f.assignedAt, f.resolvedAt);
                  const late = Boolean(f.resolveBy && new Date(f.resolvedAt) > new Date(f.resolveBy));
                  return <span className={late ? s.danger : undefined}>{`${n} day${n === 1 ? "" : "s"}${late ? " · late" : ""}`}</span>;
                },
              },
            ];

  const hasFilters = Boolean(filters.q || filters.dept);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>{cfg.title}</h1>
          <span className={`${s.countPill} ${cfg.pill}`} aria-label={`${statusTotal} complaints`}>
            {statusTotal}
          </span>
        </div>
        <p className={s.subtitle}>{cfg.subtitle}</p>
      </div>

      <section className={s.panel} aria-label={cfg.title}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} />
          <select
            aria-label="Filter by department"
            className={`select ${s.filter}`}
            value={filters.dept}
            onChange={(e) => set({ dept: e.target.value || null, page: null })}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort"
            className={`select ${s.filter}`}
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value === "oldest" ? "oldest" : null, page: null })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {loadError ? (
          <p className="alert alert-error" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">{cfg.title}</caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.label} scope="col" data-col={colType(col.label)}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.tracking_id}>
                  {columns.map((col) => (
                    <td key={col.label} data-label={col.label} className={typeof col.className === "function" ? col.className(c) : col.className}>
                      {col.cell(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loadError ? (
            hasFilters ? (
              <EmptyState
                message="No complaints match these filters."
                action={{ label: "Clear filters", onClick: () => { setQuery(""); set({ q: null, dept: null, page: null }); } }}
              />
            ) : (
              <EmptyState message="No complaints in this list yet." action={{ label: "Back to dashboard", href: "/admin" }} />
            )
          ) : null}
        </div>
        {/* paging happens on the server, so the Pager just changes ?page= */}
        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={(p) => set({ page: p === 1 ? null : p })} />
      </section>
      {modals.modals}
    </div>
  );
}