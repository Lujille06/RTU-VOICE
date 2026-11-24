"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { useToast } from "@/components/Toast";
import { validateAndloginUser } from "@/actions/authActions";
import { validateEmail } from "@/lib/validation";
import styles from "../auth.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const requested = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: validateEmail(email), password: password ? null : "Enter your password." };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);
      fd.set("next", requested ?? "");
      const res = await validateAndloginUser(fd);
      if (!res.success) {
        setFormError(res.message);
        setBusy(false);
        return;
      }
      toast("Welcome back!", "success");
      router.replace(res.redirectTo ?? "/");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles.loginRegisterCard} ${styles.loginCard}`}>
      <h2 className={styles.cardTitle}>Login</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>
        <strong>Welcome back!</strong> Please enter your details.
      </p>

      <form className={styles.form} onSubmit={submit} noValidate>
        {requested ? (
          <p className="alert alert-info" role="status" style={{ padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
            Please log in to continue. You&apos;ll go back to the page you opened.
          </p>
        ) : null}
        {formError ? (
          <p className="alert alert-error" role="alert" style={{ padding: "10px 12px", fontSize: 14 }}>
            {formError}
          </p>
        ) : null}
        <TextField
          label="University Email"
          type="email"
          autoComplete="email"
          placeholder="2000-00000@rtu.edu.ph"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((x) => ({ ...x, email: null })); }}
          onBlur={() => email && setErrors((x) => ({ ...x, email: validateEmail(email) }))}
          error={errors.email}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="•••••••••••••••"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((x) => ({ ...x, password: null })); }}
          error={errors.password}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>

        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {busy ? "Logging in…" : "Login"}
        </button>

        <p className={`${styles.switch} ${styles.caption}`}>
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}