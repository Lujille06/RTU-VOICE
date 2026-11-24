"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../Icon";
import { OtpInput } from "./OtpInput";
import styles from "@/app/(auth)/auth.module.css";

// !! must match the field name checkOtp reads from the FormData in authUtils.ts
// must match the keys checkOtp reads in authUtils.ts, in order
const DIGIT_FIELDS = ["first_digit", "second_digit", "third_digit", "fourth_digit", "fifth_digit", "sixth_digit"];
const RESEND_SECONDS = 60;

type Result = { success: boolean; message?: string };

interface Props {
  email: string;
  purpose?: "activate" | "reset";
  verify: (fd: FormData) => Promise<Result>;
  resend: () => Promise<Result>;
}

/** OTP step shared by registration and password recovery. The server decides if the code is right. */
export function OtpVerifyCard({ email, purpose = "activate", verify, resend }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS); // a code was just sent
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  const code = digits.join("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setInfo(null);
    if (code.length < 6) {
      setError("Enter all 6 digits of the code.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      digits.forEach((d, i) => fd.set(DIGIT_FIELDS[i], d));
      const res = await verify(fd);
      if (!res.success) {
        setError(res.message || "That code didn't work. Please try again.");
        setDigits(Array(6).fill(""));
        setBusy(false);
        return;
      }
      // success: stay busy, the page navigates away next
      setError(null);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    setInfo(null);
    try {
      const res = await resend();
      if (!res.success) {
        setError(res.message || "Couldn't resend the code. Please try again.");
      } else {
        setError(null);
        setDigits(Array(6).fill(""));
        setSeconds(RESEND_SECONDS);
        setInfo("A new code was sent to your email.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
      <p className={styles.cardSubtitle}>
        We sent you a 6-digit code to <strong>{email}</strong>.
        <br />
        {purpose === "activate" ? "Enter it to activate your account." : "Enter it to reset your password."} It expires in 10 minutes.
      </p>

      <form onSubmit={submit} noValidate>
        <OtpInput
          value={digits}
          onChange={(v) => {
            setDigits(v);
            if (error) setError(null);
          }}
          className={`${styles.otp} ${error ? styles.otpError : ""}`}
          boxClassName={styles.otpBox}
          invalid={!!error}
          disabled={busy}
        />

        <div className={styles.form} style={{ marginTop: 26 }}>
          {error ? (
            <p className={styles.formError} role="alert">
              <Icon name="alert-triangle" size={16} /> {error}
            </p>
          ) : null}
          {info ? (
            <p className="alert alert-info" role="status" style={{ padding: "10px 12px" }}>
              {info}
            </p>
          ) : null}

          <p className={styles.resend}>
            Didn&apos;t get it?{" "}
            <button type="button" className={styles.resendBtn} onClick={onResend} disabled={seconds > 0 || resending || busy}>
              {resending ? "Sending…" : seconds > 0 ? `Resend code (${seconds}s)` : "Resend code"}
            </button>
          </p>

          <button type="submit" className={`${styles.submit} ${styles.submitWhite}`} disabled={busy} aria-busy={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {busy ? "Verifying…" : "Verify Account"}
          </button>
        </div>
      </form>
    </div>
  );
}