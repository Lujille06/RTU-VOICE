"use client";
// src/components/department/ReturnToAdminModal.tsx

import { useState, type FormEvent } from "react";
import { Modal } from "../Modal";
import m from "../admin/modals.module.css";
import d from "./department.module.css";

const MAX_REASON = 500;

export function ReturnToAdminModal({
  complaint,
  onClose,
  onConfirm,
}: {
  complaint: { trackingId: string; title: string };
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return; // ignore a second click while the first request is running
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Enter a reason for returning this complaint.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Return to Admin" subtitle={`${complaint.trackingId} · ${complaint.title}`}>
      <form className={m.form} onSubmit={submit} noValidate>
        <p className={m.note}>This complaint will go back to Admin for reassignment to the appropriate department.</p>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="return-reason" className={m.label}>
            Reason <span className="req">*</span>
          </label>
          <textarea
            id="return-reason"
            className={`input ${m.textarea}`}
            value={reason}
            maxLength={MAX_REASON}
            required
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? "return-reason-error" : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
          />
          {error ? (
            <span id="return-reason-error" className="field-error">
              {error}
            </span>
          ) : null}
        </div>
        <div className={d.returnFooter}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn ${m.btn} ${m.danger}`} disabled={busy} aria-busy={busy}>
            {busy ? "Returning…" : "Confirm Return"}
          </button>
        </div>
      </form>
    </Modal>
  );
}