"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { useToast } from "@/components/Toast";
import { resendOtp, validateAndloginUser, verifyAndRegisterUser } from "@/actions/authActions";
import { useEmailStore, useFirstNameStore, useLastNameStore, usePasswordStore } from "@/features/auth/authStore";
import styles from "../../auth.module.css";

type Pending = { firstName: string; lastName: string; email: string; password: string };

const clearStores = () => {
  useEmailStore.getState().reset();
  useFirstNameStore.getState().reset();
  useLastNameStore.getState().reset();
  usePasswordStore.getState().reset();
};

export default function RegisterVerifyPage() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Pending | null>(null);
  const [ready, setReady] = useState(false);

  // copy once after mount; the local snapshot survives the store reset
  useEffect(() => {
    const e = useEmailStore.getState();
    if (e.flowType === "registration" && e.email) {
      setPending({
        email: e.email,
        firstName: useFirstNameStore.getState().firstName,
        lastName: useLastNameStore.getState().lastName,
        password: usePasswordStore.getState().password,
      });
    }
    setReady(true);
  }, []);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 320 }} />;

  if (!pending) {
    return (
      <div className={styles.card}>
        <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          There is no registration waiting for a code. Start by creating your account.
        </p>
        <div className={styles.form}>
          <Link href="/register" className={styles.submit} style={{ textDecoration: "none" }}>Go to Register</Link>
        </div>
      </div>
    );
  }

  return (
    <OtpVerifyCard
      email={pending.email}
      verify={async (fd: FormData) => {
        const res = await verifyAndRegisterUser(fd, pending);
        if (!res.success) return res;

        clearStores();
        const login = new FormData();
        login.set("email", pending.email);
        login.set("password", pending.password);
        const auth = await validateAndloginUser(login);

        toast("Account created. Welcome!", "success");
        router.replace(auth.success ? auth.redirectTo ?? "/dashboard" : "/login");
        router.refresh();
        return res;
      }}
      resend={() => resendOtp("registration", pending.email, pending.firstName)}
    />
  );
}