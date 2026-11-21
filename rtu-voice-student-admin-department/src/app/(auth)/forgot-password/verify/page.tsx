"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { resendOtp, verifyResetOtp } from "@/actions/authActions";
import { useEmailStore } from "@/features/auth/authStore";
import styles from "../../auth.module.css";

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const e = useEmailStore.getState();
    setEmail(e.flowType === "password_reset" && e.email ? e.email : null);
    setReady(true);
    router.prefetch("/forgot-password/reset");
  }, [router]);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 320 }} />;

  if (!email) {
    return (
      <div className={styles.card}>
        <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          Enter your university email first so we know where to send the code.
        </p>
        <div className={styles.form}>
          <Link href="/forgot-password" className={styles.submit} style={{ textDecoration: "none" }}>Go to Forgot Password</Link>
        </div>
      </div>
    );
  }

  return (
    <OtpVerifyCard
      email={email}
      purpose="reset"
      verify={async (fd: FormData) => {
        const res = await verifyResetOtp(fd, email);
        if (res.success) router.replace("/forgot-password/reset");
        return res;
      }}
      resend={() => resendOtp("password_reset", email, "")}
    />
  );
}