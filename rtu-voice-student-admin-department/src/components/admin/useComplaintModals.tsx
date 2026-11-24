"use client";
// src/components/admin/useComplaintModals.tsx  (replaces the demo-store version)

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { assignComplaint, getComplaintDetails, rejectComplaint } from "@/actions/adminActions";
import { ComplaintDetailsDialog, ComplaintUpdatesDialog } from "@/components/ComplaintDetailsDialog";
import type { AdminComplaintDetails, OngoingComplaint } from "@/features/admin/adminTypes";
import type { DepartmentOption } from "@/features/admin/adminUi";
import type { TrackedComplaint } from "@/features/student/studentTypes";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import m from "./modals.module.css";

/** What the assign / reject modals need to know about a row. */
export type Target = { id: string; tracking_id: string; title: string };

type Open =
  | { kind: "details"; details: AdminComplaintDetails }
  | { kind: "updates"; details: AdminComplaintDetails }
  | { kind: "assign"; target: Target; departmentId: number | null }
  | { kind: "reject"; target: Target }
  | { kind: "reassign"; target: OngoingComplaint }
  | null;

const GENERIC = "Something went wrong. Please try again.";

/**
 * Admin pop-ups: complaint details, assign, reject, reassign and complaint updates.
 * Returns open functions and the JSX to render once per page. Every action calls the real server
 * actions, then refreshes the page data.
 */
export function useComplaintModals(departments: DepartmentOption[]) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const [loading, setLoading] = useState(false);
  const close = () => setOpen(null);
  const active = departments.filter((d) => d.is_active);

  const done = (message: string) => {
    close();
    toast(message, "success");
    router.refresh(); // reload the lists and counts from the database
  };

  // details + updates come from the same call (it already includes the updates)
  const load = async (trackingId: string, kind: "details" | "updates") => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getComplaintDetails(trackingId);
      if (res.success && "trackResult" in res && res.trackResult) setOpen({ kind, details: res.trackResult });
      else toast(res.message || "Couldn't open that complaint.", "error");
    } catch (err) {
      console.error(err);
      toast("Couldn't open that complaint.", "error");
    } finally {
      setLoading(false);
    }
  };

  const api = {
    openDetails: (trackingId: string) => load(trackingId, "details"),
    openUpdates: (trackingId: string) => load(trackingId, "updates"),
    openAssign: (target: Target, departmentId: number | null = null) => setOpen({ kind: "assign", target, departmentId }),
    openReject: (target: Target) => setOpen({ kind: "reject", target }),
    openReassign: (target: OngoingComplaint) => {
      if (!target.can_reassign) {
        toast("This complaint can no longer be reassigned.", "error");
        return;
      }
      setOpen({ kind: "reassign", target });
    },
  };

  let node: ReactNode = null;
  if (open?.kind === "details") {
    const d = open.details;
    node = (
      <ComplaintDetailsDialog
        key={`details-${d.tracking_id}`}
        complaint={d as unknown as TrackedComplaint}
        onClose={close}
        showUpdatesButton={false}
        allowEvidenceActions={true}
        forStaff
        returnDetails={
          d.current_return
            ? { department: d.current_return.department_name ?? "", at: d.current_return.returned_at, reason: d.current_return.reason ?? "" }
            : undefined
        }
      />
    );
  }
  if (open?.kind === "updates") {
    const d = open.details;
    node = <ComplaintUpdatesDialog key={`updates-${d.tracking_id}`} complaint={d as unknown as TrackedComplaint} onClose={close} />;
  }
  if (open?.kind === "assign")
    node = <AssignModal key={open.target.id} target={open.target} departments={active} initialId={open.departmentId} onClose={close} onDone={done} />;
  if (open?.kind === "reject") node = <RejectModal key={open.target.id} target={open.target} onClose={close} onDone={done} />;
  if (open?.kind === "reassign") node = <ReassignModal key={open.target.id} target={open.target} departments={active} onClose={close} onDone={done} />;

  return { ...api, modals: node };
}

/* ---------------------------------------------------------------------------------- */

function AssignModal({
  target,
  departments,
  initialId,
  onClose,
  onDone,
}: {
  target: Target;
  departments: DepartmentOption[];
  initialId: number | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [deptId, setDeptId] = useState(initialId ? String(initialId) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!deptId) {
      setError("Choose a department.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("complaint_id", target.id);
    fd.set("department_id", deptId);
    fd.set("action", "assign");
    fd.set("reason", "");
    try {
      const res = await assignComplaint(fd);
      if (res.success) {
        const name = departments.find((d) => String(d.id) === deptId)?.name ?? "the department";
        onDone(`${target.tracking_id} approved and assigned to ${name}.`);
        return;
      }
      setError(res.message || GENERIC);
    } catch (err) {
      console.error(err);
      setError(GENERIC);
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Assign department" subtitle={`${target.tracking_id} · ${target.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="assign-dept" className={m.label}>
            Department <span className="req">*</span>
          </label>
          <select
            id="assign-dept"
            className={`select ${deptId ? "" : "is-placeholder"}`}
            value={deptId}
            onChange={(e) => {
              setDeptId(e.target.value);
              setError(null);
            }}
          >
            <option value="" disabled>
              Select department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
          {error ? (
            <span className="field-error" role="alert">
              {error}
            </span>
          ) : null}
        </div>
        <p className={m.note}>
          Assigning approves the complaint: its status becomes <strong>Assigned</strong>, the department is notified, and the AI step sets the
          priority and writes the public summary.
        </p>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`} disabled={busy} aria-busy={busy}>
            {busy ? "Assigning…" : "Assign & approve"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RejectModal({ target, onClose, onDone }: { target: Target; onClose: () => void; onDone: (message: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const r = reason.trim();
    if (r.length < 10) {
      setError(r ? "Give a little more detail (at least 10 characters)." : "Enter a reason for rejection.");
      return;
    }
    if (r.length > 500) {
      setError("Keep the reason under 500 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("complaint_id", target.id);
    fd.set("reason", r);
    try {
      const res = await rejectComplaint(fd);
      if (res.success) {
        onDone(`${target.tracking_id} rejected.`);
        return;
      }
      setError(res.message || GENERIC);
    } catch (err) {
      console.error(err);
      setError(GENERIC);
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Reject complaint" subtitle={`${target.tracking_id} · ${target.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="reject-reason" className={m.label}>
            Reason for rejection <span className="req">*</span>
          </label>
          <textarea
            id="reject-reason"
            className={`textarea ${m.textarea}`}
            placeholder="e.g. Not a campus concern — this is an advertisement."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
          {error ? (
            <span className="field-error" role="alert">
              {error}
            </span>
          ) : null}
          <span className={m.help}>The student will see that the complaint was rejected. It is permanently deleted after 30 days.</span>
        </div>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn ${m.btn} ${m.danger}`} disabled={busy} aria-busy={busy}>
            {busy ? "Rejecting…" : "Reject complaint"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReassignModal({
  target,
  departments,
  onClose,
  onDone,
}: {
  target: OngoingComplaint;
  departments: DepartmentOption[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [deptId, setDeptId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ dept?: string; reason?: string; server?: string }>({});
  const [busy, setBusy] = useState(false);

  // not the current department, and not one that already returned this complaint
  const options = departments.filter((d) => d.id !== target.department_id && !target.returned_department_ids.includes(d.id));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const r = reason.trim();
    const next = {
      dept: deptId ? undefined : "Choose the new department.",
      reason: r.length >= 10 ? undefined : r ? "Give a little more detail (at least 10 characters)." : "A reason is required. It is recorded in the activity log.",
    };
    setErrors(next);
    if (next.dept || next.reason) return;

    setBusy(true);
    const fd = new FormData();
    fd.set("complaint_id", target.id);
    fd.set("department_id", deptId);
    fd.set("action", "reassign");
    fd.set("reason", r);
    try {
      const res = await assignComplaint(fd);
      if (res.success) {
        const name = departments.find((d) => String(d.id) === deptId)?.name ?? "the new department";
        onDone(`${target.tracking_id} reassigned to ${name}.`);
        return;
      }
      setErrors({ server: res.message || GENERIC });
    } catch (err) {
      console.error(err);
      setErrors({ server: GENERIC });
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Reassign complaint" subtitle={`${target.tracking_id} · Currently with ${target.department ?? "—"}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${errors.dept ? "has-error" : ""}`}>
          <label htmlFor="reassign-dept" className={m.label}>
            New department <span className="req">*</span>
          </label>
          <select
            id="reassign-dept"
            className={`select ${deptId ? "" : "is-placeholder"}`}
            value={deptId}
            onChange={(e) => {
              setDeptId(e.target.value);
              setErrors((x) => ({ ...x, dept: undefined }));
            }}
          >
            <option value="" disabled>
              Select department
            </option>
            {options.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.dept ? <span className="field-error">{errors.dept}</span> : null}
        </div>
        <div className={`field ${errors.reason ? "has-error" : ""}`}>
          <label htmlFor="reassign-reason" className={m.label}>
            Reason for reassignment <span className="req">*</span>
          </label>
          <textarea
            id="reassign-reason"
            className={`textarea ${m.textarea}`}
            placeholder="e.g. Mistaken assignment — issue concerns network cabling, not the building."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => ({ ...x, reason: undefined }));
            }}
          />
          {errors.reason ? <span className="field-error">{errors.reason}</span> : null}
        </div>
        {errors.server ? (
          <p className="field-error" role="alert">
            {errors.server}
          </p>
        ) : null}
        <div className={`${m.footer} ${m.reassignFooter}`}>
          <button type="button" className={`btn btn-soft ${m.btn} ${m.reassignButton}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn} ${m.reassignButton}`} disabled={busy} aria-busy={busy}>
            {busy ? "Reassigning…" : "Confirm reassignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}