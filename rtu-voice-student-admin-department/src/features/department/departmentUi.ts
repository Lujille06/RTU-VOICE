import { asPriority, asStatus } from "@/features/admin/adminUi";
import type { DepartmentListKey, DepartmentComplaintRow, NeedsAttentionRow } from "@/features/department/departmentTypes";

export type DepartmentListKind = "total" | "assigned" | "progress" | "resolved";

// page kinds -> real keys of DEPARTMENT_LISTS (the in-progress list key is "in_progress")
export const LIST_KEY = {
  total: "total",
  assigned: "assigned",
  progress: "in_progress",
  resolved: "resolved",
} as const satisfies Record<DepartmentListKind, DepartmentListKey>;

// dashboard status filter value -> list
export const STATUS_TO_KIND: Record<string, DepartmentListKind> = {
  assigned: "assigned",
  in_progress: "progress",
  resolved: "resolved",
};

export type DeptRaw = DepartmentComplaintRow | NeedsAttentionRow;

/** UI row the table renders (same shape the demo Complaint had, so RowActions is unchanged). */
export type Row = {
  id: string
  trackingId: string;
  title: string;
  status: ReturnType<typeof asStatus>;
  priority: ReturnType<typeof asPriority>;
  submittedAt: string;
  assignedAt: string | null;
  sla: { label: string; tone: "danger" | "neutral" };
  attention: { label: string; late: boolean } | null;
};

const DAY = 86_400_000;
const n = (ms: number) => Math.max(1, Math.ceil(Math.abs(ms) / DAY));

export function toRow(r: DeptRaw): Row {
  const now = Date.now();
  const st = r.status_name;
  const ackDue = r.ack_due_at ? new Date(r.ack_due_at).getTime() - now : null;
  const resDue = r.resolve_due_at ? new Date(r.resolve_due_at).getTime() - now : null;

  let sla: Row["sla"] = { label: "—", tone: "neutral" };
  if (st === "assigned" && ackDue !== null) {
    sla = ackDue < 0
      ? { label: `Not acknowledged · ${n(ackDue)}d late`, tone: "danger" }
      : { label: `Acknowledge within ${n(ackDue)}d`, tone: "neutral" };
  } else if (st === "in_progress" && resDue !== null) {
    sla = resDue < 0
      ? { label: `${n(resDue)}d overdue`, tone: "danger" }
      : { label: `Due in ${n(resDue)}d`, tone: "neutral" };
  }

  let attention: Row["attention"] = null;
  if ("is_overdue" in r) {
    attention = r.is_overdue && resDue !== null
      ? { label: `${n(resDue)}d overdue`, late: true }
      : { label: ackDue !== null && ackDue < 0 ? `Unacknowledged · ${n(ackDue)}d late` : `Unacknowledged · due in ${ackDue !== null ? n(ackDue) : 0}d`, late: ackDue !== null && ackDue < 0 };
  }

  return {
    id: r.id,
    trackingId: r.tracking_id,
    title: r.title,
    status: asStatus(st),
    priority: asPriority(r.priority_name ?? ""),
    submittedAt: r.created_at,
    assignedAt: r.assigned_at ?? null,
    sla,
    attention,
  };
}