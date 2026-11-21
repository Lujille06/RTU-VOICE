"use client";
// src/app/admin/AdminDashboard.tsx  (replaces the demo-store version)

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { EmptyState, LockedChip, Pager, PriorityDot, SearchBox, StatusPill, adminStyles as s } from "@/components/admin/bits";
import { StatCards, type StatCounts } from "@/components/admin/StatCards";
import { ReturnedPill } from "@/components/admin/ReturnedInfo";
import { useComplaintModals } from "@/components/admin/useComplaintModals";
import { useUrlFilters } from "@/components/admin/useUrlFilters";
import type { OngoingComplaint, PendingComplaint } from "@/features/admin/adminTypes";
import { asPriority, asStatus, ongoingSla, type DepartmentOption } from "@/features/admin/adminUi";
import { formatShortDate } from "@/lib/format";
import styles from "./dashboard.module.css";

const PAGE_SIZE = 8;
const MASTER_STATUS_OPTIONS = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
] as const;

type Filters = { q: string; sort: "newest" | "oldest"; status: string; dept: string };

type Props = {
  tab: "pending" | "master";
  // ADJUST: the shape ComplaintCounts really has (see sharedTypes). Mapped in one place below.
  counts: Record<string, number> | null;
  pending: PendingComplaint[];
  master: OngoingComplaint[];
  departments: DepartmentOption[];
  loadError: string | null;
  filters: Filters;
};

function toStatCounts(c: Record<string, number> | null): StatCounts {
  return {
    total: c?.total ?? 0,
    assigned: c?.assigned ?? 0,
    inProgress: c?.in_progress ?? c?.inProgress ?? 0,
    resolved: c?.resolved ?? 0,
  };
}

export function AdminDashboard({ tab, counts, pending, master, departments, loadError, filters }: Props) {
  const { set } = useUrlFilters();
  const modals = useComplaintModals(departments);

  const setTab = (t: "pending" | "master") => set({ tab: t === "master" ? "master" : null, q: null, sort: null, status: null, dept: null });

  return (
    <div className="container">
      <div className={s.head}>
        <h1 className={s.title}>Dashboard</h1>
        <p className={s.subtitle}>
          {tab === "master" ? "Master Tracking Queue — approved complaints now in department portals." : "Select a box to open its list."}
        </p>
      </div>

      <StatCards counts={toStatCounts(counts)} />

      {loadError ? (
        <p className="alert alert-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <section className={s.panel} aria-label="Complaint queues">
        <div className={styles.tabs} role="tablist" aria-label="Queues">
          <button
            type="button"
            role="tab"
            id="tab-pending"
            aria-selected={tab === "pending"}
            aria-controls="panel-pending"
            className={`${styles.tab} ${tab === "pending" ? styles.tabActive : ""}`}
            onClick={() => setTab("pending")}
          >
            <span className={styles.tabText}>
              Pending Validation<br className={styles.mobileTabBreak} /> Queue
            </span>
            <span className={styles.tabCount}>{pending.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-master"
            aria-selected={tab === "master"}
            aria-controls="panel-master"
            className={`${styles.tab} ${tab === "master" ? styles.tabActive : ""}`}
            onClick={() => setTab("master")}
          >
            <span className={styles.tabText}>
              Master Tracking<br className={styles.mobileTabBreak} /> Queue
            </span>
            <span className={styles.tabCount}>{master.length}</span>
          </button>
        </div>

        {tab === "pending" ? (
          <PendingQueue rows={pending} departments={departments} filters={filters} modals={modals} />
        ) : (
          <MasterQueue rows={master} departments={departments} filters={filters} modals={modals} />
        )}
      </section>
      {modals.modals}
    </div>
  );
}

type Modals = ReturnType<typeof useComplaintModals>;

/** Search box that waits for you to stop typing, then puts the search in the URL. */
function useDebouncedSearch(initial: string, set: (next: Record<string, string | null>) => void, extra: Record<string, null> = {}) {
  const [query, setQuery] = useState(initial);
  useEffect(() => {
    if (query === initial) return;
    const t = setTimeout(() => set({ q: query.trim() || null, ...extra }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  return [query, setQuery] as const;
}

function PendingQueue({ rows, departments, filters, modals }: { rows: PendingComplaint[]; departments: DepartmentOption[]; filters: Filters; modals: Modals }) {
  const { set } = useUrlFilters();
  const [query, setQuery] = useDebouncedSearch(filters.q, set);
  const active = departments.filter((d) => d.is_active); // only active departments can receive assignments

  return (
    <div id="panel-pending" role="tabpanel" aria-labelledby="tab-pending">
      <div className={s.toolbar}>
        <SearchBox value={query} onChange={setQuery} />
        <select aria-label="Sort" className={`select ${s.filter}`} value={filters.sort} onChange={(e) => set({ sort: e.target.value === "oldest" ? "oldest" : null })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <p className={s.hint}>Choosing a department approves the complaint and runs the AI step.</p>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className="visually-hidden">Pending validation queue</caption>
          <thead>
            <tr>
              <th scope="col" data-col="date">Date</th>
              <th scope="col" data-col="id">Tracking ID</th>
              <th scope="col" data-col="title">Title</th>
              <th scope="col" data-col="category">Category</th>
              <th scope="col" data-col="assign">Assign</th>
              <th scope="col" data-col="reject">
                <span className="visually-hidden">Reject</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td data-label="Date" className={s.date}>
                  {formatShortDate(c.created_at)}
                </td>
                <td data-label="Tracking ID">
                  <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.tracking_id)}>
                    {c.tracking_id}
                  </button>
                </td>
                <td data-label="Title" className={s.strong}>
                  <span className={styles.returnedTitle}>
                    <span>{c.title}</span>
                    {c.is_returned && c.returned_at ? (
                      <ReturnedPill details={{ department: c.returned_by_department ?? "", at: c.returned_at, reason: c.return_reason ?? "" } as never} />
                    ) : null}
                  </span>
                </td>
                <td data-label="Category">{c.category ?? "—"}</td>
                <td data-label="Assign">
                  <select
                    aria-label={`Assign ${c.tracking_id} to a department`}
                    className={`select ${s.rowSelect}`}
                    value=""
                    onChange={(e) => modals.openAssign(c, Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Assign department...
                    </option>
                    {active.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="">
                  <div className={s.actions}>
                    <button type="button" className={s.reject} onClick={() => modals.openReject(c)} aria-label={`Reject ${c.tracking_id}`}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          filters.q ? (
            <EmptyState message={`No pending complaint matches “${filters.q}”.`} action={{ label: "Clear search", onClick: () => { setQuery(""); set({ q: null }); } }} />
          ) : (
            <EmptyState message="All caught up — no complaints are waiting for validation." action={{ label: "View all complaints", href: "/admin/complaints" }} />
          )
        ) : null}
      </div>
    </div>
  );
}

function MasterQueue({ rows, departments, filters, modals }: { rows: OngoingComplaint[]; departments: DepartmentOption[]; filters: Filters; modals: Modals }) {
  const { set } = useUrlFilters();
  const [query, setQuery] = useDebouncedSearch(filters.q, set);
  const [page, setPage] = useState(1);

  // the filters run on the server; the list comes back whole, so paging stays here
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasFilters = Boolean(filters.q || filters.status || filters.dept);

  return (
    <div id="panel-master" role="tabpanel" aria-labelledby="tab-master">
      <div className={s.toolbar}>
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by status"
          className={`select ${s.filter}`}
          value={filters.status}
          onChange={(e) => {
            set({ status: e.target.value || null });
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {MASTER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by department"
          className={`select ${s.filter}`}
          value={filters.dept}
          onChange={(e) => {
            set({ dept: e.target.value || null });
            setPage(1);
          }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className="visually-hidden">Master tracking queue</caption>
          <thead>
            <tr>
              <th scope="col" data-col="date">Date</th>
              <th scope="col" data-col="id">Tracking ID</th>
              <th scope="col" data-col="title">Title</th>
              <th scope="col" data-col="priority">Priority</th>
              <th scope="col" data-col="status">Status</th>
              <th scope="col" data-col="sla">SLA</th>
              <th scope="col" data-col="actions-admin">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const sla = ongoingSla(c);
              return (
                <tr key={c.id}>
                  <td data-label="Date" className={s.date}>
                    {formatShortDate(c.created_at)}
                  </td>
                  <td data-label="Tracking ID">
                    <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.tracking_id)}>
                      {c.tracking_id}
                    </button>
                  </td>
                  <td data-label="Title" className={`${s.strong} ${styles.titleCell}`}>
                    {c.title}
                  </td>
                  <td data-label="Priority">
                    <PriorityDot priority={asPriority(c.priority)} />
                  </td>
                  <td data-label="Status">
                    <StatusPill status={asStatus(c.status)} />
                  </td>
                  <td data-label="SLA" className={sla.tone === "danger" ? s.danger : sla.tone === "success" ? s.success : s.muted}>
                    {sla.label}
                  </td>
                  <td data-label="">
                    <div className={s.actions}>
                      <button type="button" className={`${s.ghostBtn} ${s.slotView}`} onClick={() => modals.openUpdates(c.tracking_id)}>
                        View updates
                      </button>
                      {c.can_reassign ? (
                        <button type="button" className={`${s.outlineBtn} ${s.slotMain}`} onClick={() => modals.openReassign(c)}>
                          <Icon name="swap" size={16} strokeWidth={2.2} /> Reassign
                        </button>
                      ) : (
                        <LockedChip
                          reason={
                            c.status === "resolved"
                              ? "The complaint is resolved, so it can't be reassigned."
                              : "The department has started working on this, so it can't be reassigned."
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <EmptyState
            message={hasFilters ? "No complaints match these filters." : "No approved complaints yet."}
            action={
              hasFilters
                ? { label: "Clear filters", onClick: () => { setQuery(""); setPage(1); set({ q: null, status: null, dept: null }); } }
                : { label: "View all complaints", href: "/admin/complaints" }
            }
          />
        ) : null}
      </div>
      <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
    </div>
  );
}