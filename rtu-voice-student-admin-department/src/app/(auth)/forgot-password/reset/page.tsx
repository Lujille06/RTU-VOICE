"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PasswordField } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { resetPassword } from "@/actions/authActions";
import { useEmailStore } from "@/features/auth/authStore";
import { passwordChecks, validateConfirm, validateNewPassword } from "@/lib/validation";
import styles from "../../auth.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { router.prefetch("/login"); }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next = { password: validateNewPassword(password), confirm: validateConfirm(password, confirm) };
    setErrors(next);
    if (next.password || next.confirm) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("newPassword", password);
      fd.set("confirmPassword", confirm);
      const res = await resetPassword(fd);
      if (!res.success) {
        if (/expired/i.test(res.message)) setExpired(true);
        else setFormError(res.message);
        setBusy(false);
        return;
      }
      useEmailStore.getState().reset();
      toast("Password updated. You can now log in.", "success");
      router.replace("/login");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  if (expired) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Set a new password</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          Your reset session expired. Verify your email again.
        </p>
        <div className={styles.form}>
          <Link href="/forgot-password" className={styles.submit} style={{ textDecoration: "none" }}>Start password recovery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <Image src="/images/rtu-voice-logo.png" alt="" width={200} height={179} className={styles.cardLogo} />
      <h2 className={styles.cardTitle}>Set a new password</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>Choose a strong password for your account.</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        {formError ? <p className="alert alert-error" role="alert" style={{ padding: "10px 12px", fontSize: 14 }}>{formError}</p> : null}
        <PasswordField label="New Password" autoComplete="new-password" placeholder="At least 8 characters"
          value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((x) => ({ ...x, password: null })); }}
          error={errors.password} labelClassName={styles.label} inputClassName={styles.input} />
        <ul className={styles.reqs} aria-label="Password requirements">
          {passwordChecks(password).map((c) => (
            <li key={c.label} className={c.ok ? styles.reqOk : undefined}>
              <Icon name={c.ok ? "check" : "x"} size={12} strokeWidth={2.6} />
              {c.label}
            </li>
          ))}
        </ul>
        <PasswordField label="Confirm New Password" autoComplete="new-password" placeholder="•••••••••••••••"
          value={confirm} onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((x) => ({ ...x, confirm: null })); }}
          error={errors.confirm} labelClassName={styles.label} inputClassName={styles.input} />
        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {busy ? "Saving…" : "Reset Password"}
        </button>
        <p className={`${styles.switch} ${styles.caption}`}>
          Remember your password? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}