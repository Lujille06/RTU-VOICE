"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { addComplaintUpdate, getComplaintDetailsDepartment, returnComplaint, updateComplaintStatus } from "@/actions/departmentActions";
import { getComplaintUpdates } from "@/actions/sharedActions";
import { formatMonthDay, formatShortDate, formatTime } from "@/lib/format";
import { nextDepartmentStatus, type DepartmentStatus } from "@/lib/types";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { useDebouncedSearch, useUrlFilters } from "@/components/admin/useUrlFilters";
import { toRow, type DepartmentListKind, type DeptRaw, type Row } from "@/features/department/departmentUi";
import { Icon } from "../Icon";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { BackToDashboard, EmptyState, Pager, PriorityDot, SearchBox, StatusPill, adminStyles as s } from "../admin/bits";
import { StatCards } from "../admin/StatCards";
import { useDepartmentModals } from "./useDepartmentModals";
import { ReturnToAdminModal } from "./ReturnToAdminModal";
import m from "../admin/modals.module.css";
import d from "./department.module.css";

const UPDATE_MAX = 500;
const UPDATE_MIN = 10;
const when = (iso: string) => `${formatMonthDay(iso)}, ${formatTime(iso)}`;

const ErrorBanner = ({ message }: { message: string | null }) =>
  message ? <p className="alert alert-error" role="alert">{message}</p> : null;

/* ------------------------------ row actions + modals ------------------------------ */

function useQueueActions() {
  const { refresh } = useUrlFilters();
  const toast = useToast();
  const [updating, setUpdating] = useState<Row | null>(null);
  const [pending, setPending] = useState<{ c: Row; status: DepartmentStatus } | null>(null);
  const [returning, setReturning] = useState<Row | null>(null);
  const modals = useDepartmentModals();

  const confirmStatus = async () => {
    if (!pending) return;
    const { c, status } = pending;
    setPending(null);
    const res = await updateComplaintStatus(c.id, status === "In Progress" ? "in_progress" : "resolved");
    toast(res.message, res.success ? "success" : "error");
    if (res.success) refresh();
  };

  const confirmReturn = async (reason: string) => {
    if (!returning) return;
    const res = await returnComplaint(returning.id, reason);
    toast(res.message, res.success ? "success" : "error");
    if (res.success) {
      setReturning(null);
      refresh();
    }
  };

  return {
    modals,
    setStatus: (c: Row, status: DepartmentStatus) => setPending({ c, status }),
    openUpdate: (c: Row) => setUpdating(c),
    openReturn: (c: Row) => setReturning(c),
    updateModal: (
      <>
        {updating ? <AddUpdateModal key={updating.trackingId} row={updating} onClose={() => setUpdating(null)} /> : null}
        {pending ? <ConfirmStatusModal key={pending.c.trackingId} c={pending.c} status={pending.status} onCancel={() => setPending(null)} onConfirm={confirmStatus} /> : null}
        {returning ? <ReturnToAdminModal key={returning.trackingId} complaint={returning} onClose={() => setReturning(null)} onConfirm={confirmReturn} /> : null}
      </>
    ),
  };
}

function RowActions({
  c,
  onStatus,
  onAdd,
  onView,
  onReturn,
}: {
  c: Row;
  onStatus: (c: Row, s: DepartmentStatus) => void;
  onAdd: (c: Row) => void;
  onView: (id: string) => void;
  onReturn: (c: Row) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuElementRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const next = nextDepartmentStatus(c.status);
  const locked = c.status === "Resolved" || !next;
  const menuId = `department-actions-${c.trackingId.toLowerCase()}`;
  const canReturn = c.status === "Assigned";
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target) &&
        !menuElementRef.current?.contains(event.target)
      ) setMenuOpen(false);
    };
    const closeOnViewportChange = () => setMenuOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", closeOnViewportChange);
    document.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", closeOnViewportChange);
      document.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) menuElementRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [menuOpen]);

  const openMenu = () => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const menuWidth = 218;
    const menuHeight = 166;
    const gutter = 12;
    const left = Math.max(gutter, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gutter));
    const below = rect.bottom + 6;
    const top = below + menuHeight <= window.innerHeight - gutter
      ? below
      : Math.max(gutter, rect.top - menuHeight - 6);
    setMenuPosition({ top, left });
    setMenuOpen((open) => !open);
  };

  return (
    <div className={d.rowActions}>
      {locked ? (
        <button type="button" className={`${s.lockedChip} ${d.lockedButton}`} disabled title="Resolved complaints are locked and cannot be changed." aria-label={`Locked: ${c.trackingId} is resolved`}>
          <Icon name="lock" size={14} strokeWidth={2.2} />
          Locked
        </button>
      ) : (
        <select
          aria-label={`Update status of ${c.trackingId}`}
          className={`select ${d.updateSelect}`}
          value=""
          onChange={(e) => {
            const st = e.target.value as DepartmentStatus;
            if (st === next) onStatus(c, st);
          }}
        >
          <option value="" disabled>Update status</option>
          <option value="" disabled>{c.status === "In Progress" ? "In progress" : c.status} (current)</option>
          {next ? <option value={next}>{next === "In Progress" ? "In progress" : next}</option> : null}
        </select>
      )}
      <div className={d.menuWrap} ref={menuRef}>
        <button
          ref={menuButtonRef}
          type="button"
          className={d.kebab}
          aria-label={`More actions for ${c.trackingId}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={openMenu}
        >
          <span aria-hidden="true">⋯</span>
        </button>
        {menuOpen && menuPosition && typeof document !== "undefined"
          ? createPortal(
          <div
            ref={menuElementRef}
            className={d.actionMenu}
            id={menuId}
            role="menu"
            aria-label={`Actions for ${c.trackingId}`}
            style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, right: "auto" }}
            onKeyDown={(event) => {
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
              const index = items.indexOf(document.activeElement as HTMLButtonElement);
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
              } else if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                items[event.key === "Home" ? 0 : items.length - 1]?.focus();
              }
            }}
          >
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onView(c.trackingId); }}>View updates</button>
            <button
              type="button"
              role="menuitem"
              aria-disabled={locked}
              className={locked ? d.menuItemDisabled : ""}
              onClick={() => {
                if (locked) return;
                setMenuOpen(false);
                onAdd(c);
              }}
            >
              <span>Add update</span>
              {locked ? <small>Resolved — locked</small> : null}
            </button>
            <span className={d.menuDivider} role="separator" />
            <button
              type="button"
              role="menuitem"
              aria-disabled={!canReturn}
              className={`${d.menuReturn} ${!canReturn ? d.menuItemDisabled : ""}`}
              onClick={() => {
                if (!canReturn) return;
                setMenuOpen(false);
                onReturn(c);
              }}
            >
              <span><Icon name="undo" size={15} strokeWidth={2} /> Return to Admin</span>
              {!canReturn ? <small>{c.status === "Resolved" ? "Resolved — locked" : "In progress — can't be returned"}</small> : null}
            </button>
          </div>,
          document.body,
          )
          : null}
      </div>
    </div>
  );
}

function Table({ caption, rows, actions, mode = "queue" }: { caption: string; rows: Row[]; actions: ReturnType<typeof useQueueActions>; mode?: "queue" | "attention" }) {
  return (
    <table className={s.table}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" data-col="date">Date</th>
          <th scope="col" data-col="id">Tracking ID</th>
          <th scope="col" data-col="title">Title</th>
          {mode === "queue" ? <th scope="col" data-col="date">Assigned</th> : null}
          <th scope="col" data-col="priority">Priority</th>
          <th scope="col" data-col="status">Status</th>
          <th scope="col" data-col={mode === "attention" ? "attention" : "sla"}>{mode === "attention" ? "Needs attention" : "SLA"}</th>
          <th scope="col" data-col="actions-dept"><span className="visually-hidden">Update status and add update</span></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.trackingId} className={d.departmentRow}>
            <td data-label="Date" className={s.date}>{formatShortDate(c.submittedAt)}</td>
            <td data-label="Tracking ID">
              <button type="button" className={s.idLink} onClick={() => actions.modals.openDetails(c.trackingId)}>{c.trackingId}</button>
            </td>
            <td data-label="Title" className={`${s.strong} ${d.titleCell}`}>{c.title}</td>
            {mode === "queue" ? <td data-label="Assigned" className={s.date}>{c.assignedAt ? formatShortDate(c.assignedAt) : "—"}</td> : null}
            <td data-label="Priority"><PriorityDot priority={c.priority} /></td>
            <td data-label="Status"><StatusPill status={c.status} /></td>
            {mode === "attention" ? (
              <td data-label="Needs attention" className={`${d.reason} ${c.attention?.late ? d.reasonLate : d.reasonWait}`}>{c.attention?.label ?? "—"}</td>
            ) : (
              <td data-label="SLA" className={`${d.slaCell} ${c.status !== "Resolved" && c.sla.tone === "danger" ? d.slaOverdue : s.muted}`}>{c.sla.label}</td>
            )}
            <td data-label="Actions">
              <RowActions c={c} onStatus={actions.setStatus} onAdd={actions.openUpdate} onView={actions.modals.openUpdates} onReturn={actions.openReturn} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------ dashboard ------------------------------ */

export function DepartmentDashboard({
  counts, rows: raw, total, loadError, filters,
}: {
  counts: Record<string, number> | null;
  rows: DeptRaw[];
  total: number;
  loadError: string | null;
  filters: { q: string; status: string; page: number };
}) {
  console.log(raw[0]);
  const { update, pending: loading } = useUrlFilters();
  const actions = useQueueActions();
  const [query, setQuery] = useDebouncedSearch(filters.q, (v) => update({ q: v.trim(), page: null }));
  const rows = raw.map(toRow);
  const hasFilters = Boolean(filters.q || filters.status);

  return (
    <div className="container">
      <div className={s.head}>
        <h1 className="page-title">Dashboard</h1>
        <p className={s.subtitle}>Complaints assigned to your department. Student identities are never shown.</p>
      </div>

      <StatCards
        counts={{ total: counts?.total ?? 0, assigned: counts?.assigned ?? 0, inProgress: counts?.in_progress ?? 0, resolved: counts?.resolved ?? 0 }}
        base="/department"
      />
      <ErrorBanner message={loadError} />

      <section className={s.panel} aria-label="Department complaint queue" aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} />
          <select aria-label="Filter by status" className={`select ${s.filter}`} value={filters.status} onChange={(e) => update({ status: e.target.value, page: null })}>
            <option value="">All statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption="Complaints assigned to your department" rows={rows} actions={actions} />
          {rows.length === 0 && !loadError ? (
            hasFilters ? (
              <EmptyState message="No complaints match these filters." action={{ label: "Clear filters", onClick: () => { setQuery(""); update({ q: null, status: null, page: null }); } }} />
            ) : (
              <EmptyState message="No complaints are assigned to your department yet." hint="New complaints appear here as soon as an admin assigns them to you." />
            )
          ) : null}
        </div>
        <Pager page={filters.page} pageSize={PAGE_SIZE} total={total} onPage={(p) => update({ page: p > 1 ? p : null })} />
        <p className={d.footnote}>Status changes follow the review process. Resolved and In progress complaints are locked; other complaints may be returned to Admin for reassignment.</p>
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

/* ------------------------------ list pages ------------------------------ */

const LISTS: Record<DepartmentListKind, { title: string; subtitle: string; pill: string }> = {
  total: { title: "Total complaints", subtitle: "Every complaint assigned to your department.", pill: s.pillTotal },
  assigned: { title: "Assigned", subtitle: "Waiting for your department to start work.", pill: s.pillAssigned },
  progress: { title: "In progress", subtitle: "Complaints your department is currently working on.", pill: s.pillProgress },
  resolved: { title: "Resolved", subtitle: "Complaints your department has resolved.", pill: s.pillResolved },
};

export function DepartmentList({
  kind, rows: raw, total, statusTotal, loadError, filters,
}: {
  kind: DepartmentListKind;
  rows: DeptRaw[];
  total: number;
  statusTotal: number;
  loadError: string | null;
  filters: { q: string; sort: "newest" | "oldest"; page: number };
}) {
  const { update, pending: loading } = useUrlFilters();
  const actions = useQueueActions();
  const cfg = LISTS[kind];
  const [query, setQuery] = useDebouncedSearch(filters.q, (v) => update({ q: v.trim(), page: null }));
  const rows = raw.map(toRow);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
        <div className={s.listTitleRow}>
          <h1 className="page-title">{cfg.title}</h1>
          <span className={`${s.countPill} ${cfg.pill}`} aria-label={`${statusTotal} complaints`}>{statusTotal}</span>
        </div>
        <p className={s.subtitle}>{cfg.subtitle}</p>
      </div>
      <ErrorBanner message={loadError} />
      <section className={s.panel} aria-label={cfg.title} aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} />
          <select aria-label="Sort" className={`select ${s.filter}`} value={filters.sort} onChange={(e) => update({ sort: e.target.value === "oldest" ? "oldest" : null, page: null })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption={cfg.title} rows={rows} actions={actions} />
          {rows.length === 0 && !loadError ? (
            filters.q ? (
              <EmptyState message="No complaints match your search." action={{ label: "Clear search", onClick: () => { setQuery(""); update({ q: null, page: null }); } }} />
            ) : (
              <EmptyState message="No complaints in this list yet." action={{ label: "Back to dashboard", href: "/department" }} />
            )
          ) : null}
        </div>
        <Pager page={filters.page} pageSize={PAGE_SIZE} total={total} onPage={(p) => update({ page: p > 1 ? p : null })} />
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

/* ------------------------------ needs attention ------------------------------ */

export function NeedsAttention({
  rows: raw, total, overdueCount, waitingCount, badge, priorities, loadError, filters,
}: {
  rows: DeptRaw[];
  total: number;
  overdueCount: number;
  waitingCount: number;
  badge: number;
  priorities: { id: number; name: string }[];
  loadError: string | null;
  filters: { q: string; priority: string; page: number };
}) {
  const { update, pending: loading } = useUrlFilters();
  const actions = useQueueActions();
  const [query, setQuery] = useDebouncedSearch(filters.q, (v) => update({ q: v.trim(), page: null }));
  const rows = raw.map(toRow);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
        <div className={s.listTitleRow}>
          <h1 className="page-title">Needs attention</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${badge} complaints need attention`}>{badge}</span>
        </div>
        <p className={s.subtitle}>
          {overdueCount} overdue · {waitingCount} waiting to be acknowledged. Most overdue first; the SLA clock started when each complaint was assigned.
        </p>
      </div>
      <ErrorBanner message={loadError} />
      <section className={s.panel} aria-label="Complaints that need attention" aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} />
          <select aria-label="Filter by priority" className={`select ${s.filter}`} value={filters.priority} onChange={(e) => update({ priority: e.target.value, page: null })}>
            <option value="">All priority levels</option>
            {priorities.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption="Complaints that need attention" rows={rows} actions={actions} mode="attention" />
          {rows.length === 0 && !loadError ? (
            badge === 0 ? (
              <EmptyState message="Nothing needs attention right now. Well done!" hint="Overdue complaints and ones still waiting to be acknowledged show up here." action={{ label: "View all complaints", href: "/department/complaints" }} />
            ) : (
              <EmptyState message="No complaints match these filters." action={{ label: "Clear filters", onClick: () => { setQuery(""); update({ q: null, priority: null, page: null }); } }} />
            )
          ) : null}
        </div>
        <Pager page={filters.page} pageSize={PAGE_SIZE} total={total} onPage={(p) => update({ page: p > 1 ? p : null })} />
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

/* ------------------------------ modals ------------------------------ */

function ConfirmStatusModal({ c, status, onCancel, onConfirm }: { c: Row; status: DepartmentStatus; onCancel: () => void; onConfirm: () => void }) {
  const [busy, setBusy] = useState(false);
  const label = status === "In Progress" ? "In progress" : "Resolved";
  return (
    <Modal
      open
      onClose={onCancel}
      align="left"
      size="sm"
      variant="dialog"
      title={`Mark as ${label}?`}
      subtitle={`${c.trackingId} · ${c.title}`}
      footer={
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn btn-primary ${m.btn}`} disabled={busy} onClick={() => { if (busy) return; setBusy(true); onConfirm(); }}>
            Mark {label}
          </button>
        </div>
      }
    >
      <p className={d.confirmText}>
        {status === "In Progress"
          ? "This tells the student your office has started working on it. An administrator can no longer reassign it, and the status can't go back to Assigned."
          : "This closes the complaint. After this you can't change its status or add more updates."}
      </p>
    </Modal>
  );
}

type PrevUpdate = { id: string; created_at: string; message: string };

function AddUpdateModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const { refresh } = useUrlFilters();
  const toast = useToast();
  const complaintId = row.id;
  const [previous, setPrevious] = useState<PrevUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      const r = await getComplaintUpdates(row.id);
      if (!off && r.success && "updates" in r && r.updates) setPrevious(r.updates as PrevUpdate[]);
    })();
    return () => { off = true; };
  }, [row.id]);

  if (row.status === "Resolved") return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < UPDATE_MIN) {
      setError(text ? `Write a little more (at least ${UPDATE_MIN} characters).` : "Enter the update for the student.");
      return;
    }
    setConfirming(true);
  };

  const post = async () => {
    if (posting || !complaintId) return;
    setPosting(true);
    const res = await addComplaintUpdate(complaintId, message.trim());
    if (res.success) {
      toast(`Update added to ${row.trackingId}. The student is notified by email.`, "success");
      refresh();
      onClose();
    } else {
      setPosting(false);
      setConfirming(false);
      toast(res.message, "error");
    }
  };

  if (confirming) {
    return (
      <Modal
        open
        onClose={() => setConfirming(false)}
        align="left"
        size="sm"
        variant="dialog"
        title="Post this update?"
        subtitle={`${row.trackingId} · ${row.title}`}
        footer={
          <div className={m.footer}>
            <button type="button" className={`btn btn-soft ${m.btn}`} onClick={() => setConfirming(false)} disabled={posting}>Back to edit</button>
            <button type="button" className={`btn btn-primary ${m.btn}`} onClick={post} disabled={posting || !complaintId}>Post update</button>
          </div>
        }
      >
        <p className={d.confirmText}>The student and administrators will see this message. You can&apos;t edit or delete it after posting.</p>
        <blockquote className={d.confirmQuote}>{message.trim()}</blockquote>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} align="left" size="md" variant="dialog" title="Add update" subtitle={`${row.trackingId} · ${row.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="dept-update" className={m.label}>Update message <span className="req">*</span></label>
          <textarea
            id="dept-update"
            className={`textarea ${m.textarea}`}
            maxLength={UPDATE_MAX}
            placeholder="e.g. Our maintenance team inspected the area. Repair is scheduled for this week."
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(null); }}
          />
          {error ? <span className="field-error">{error}</span> : null}
          <span className={d.counter}>{message.length}/{UPDATE_MAX}</span>
          <span className={m.help}>
            The student who submitted this complaint reads it through <strong>View Update</strong>, and administrators see it in the Master Tracking Queue. It is never shown on the public dashboard. Do not include personal details.
          </span>
        </div>

        {previous.length > 0 ? (
          <div>
            <p className={d.prevTitle}>Previous updates</p>
            <ul className={d.prevList}>
              {previous.map((u) => (
                <li key={u.id} className={d.prevItem}>
                  <span className={d.prevTime}>{when(u.created_at)}</span>
                  {u.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${m.btn}`} disabled={!complaintId}>Review update</button>
        </div>
      </form>
    </Modal>
  );
}