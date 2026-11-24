"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "../Modal";
import m from "./modals.module.css";
import x from "./superadmin.module.css";

/**
 * Yes/no confirmation for superadmin actions. onConfirm returns an error message to show
 * inside the dialog (the action did not happen), or null when it succeeded. It may be async:
 * the buttons stay disabled while it runs, so a server action can be awaited here and a
 * refusal (for example "open complaints") is shown in the dialog.
 */
export function ConfirmDialog({
  title,
  subtitle,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  subtitle?: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => string | null | Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onClose={onCancel}
      align="left"
      size="sm"
      title={title}
      subtitle={subtitle}
      footer={
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? m.danger : "btn-primary"} ${m.btn}`}
            disabled={busy || !!error}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              try {
                const result = await onConfirm();
                // on success the caller closes the dialog; on a refusal stay open with the reason
                if (result) {
                  setError(result);
                  setBusy(false);
                }
              } catch (err) {
                // the server action itself failed (network, crash): show it instead of freezing the dialog
                console.error(err);
                setError("Something went wrong. Please try again.");
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className={x.confirmBody}>{body}</div>
      {error ? (
        <p className={`field-error ${x.confirmError}`} role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}