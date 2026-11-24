"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/forms/Fields";
import { validateEmailForPwReset } from "@/actions/authActions";
import { useEmailStore } from "@/features/auth/authStore";
import { validateEmail } from "@/lib/validation";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("email", email);
      const res = await validateEmailForPwReset(fd);
      if (!res.success) { setError(res.message); setBusy(false); return; }

      useEmailStore.getState().setEmail(email.trim().toLowerCase(), "password_reset");
      router.push("/forgot-password/verify");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Forgot Password</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>
        Enter your university email. We will send a<br />verification code to it.
      </p>
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextField label="University Email" type="email" autoComplete="email" placeholder="2000-000000@rtu.edu.ph"
          value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
          error={error} labelClassName={styles.label} inputClassName={styles.input} />
        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {busy ? "Sending code…" : "Send Code"}
        </button>
        <p className={`${styles.switch} ${styles.caption}`}>
          Remember your password? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}