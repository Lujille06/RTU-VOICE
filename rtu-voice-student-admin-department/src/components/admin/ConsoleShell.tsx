"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { logoutUser } from "@/actions/authActions";
import { Icon, type IconName } from "../Icon";
import { Logo } from "../Logo";
import { LogoutDialog } from "../portal/LogoutDialog";
import { PortalHeader } from "../portal/PortalHeader";
import { useToast } from "../Toast";
import { ShellSkeleton, useMinimumSkeletonDisplay } from "../Skeletons";
import styles from "./AdminShell.module.css";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface ConsoleShellProps {
  nav: ConsoleNavItem[];
  /** Home route (logo link). */
  homeHref: string;
  profileHref: string;
  /** Header label, e.g. "Central Admin Console" or "Department Portal". */
  consoleLabel: string;
  /** Optional second header line, e.g. the department name. */
  consoleSub?: string;
  menuLabel: string;
  children: ReactNode;
}

/**
 * Shared layout for the Central Admin Console and the Department Portal.
 * Session and role are enforced on the server (requireRole in the layout + RLS);
 * the signed-in user reaches the header through CurrentUserProvider.
 */
export function ConsoleShell({ nav, homeHref, profileHref, consoleLabel, consoleSub, menuLabel, children }: ConsoleShellProps) {
  const pathname = usePathname();
  const toast = useToast();
  const minimumSkeletonElapsed = useMinimumSkeletonDisplay();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const doLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setConfirmLogout(false);
    try {
      await logoutUser(); // signs out and redirects to /login
    } catch (e) {
      // Next throws a redirect error on purpose; let it through. Anything else is a real failure.
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
      setLoggingOut(false);
      toast("Couldn't log out. Please try again.", "error");
    }
  }, [loggingOut, toast]);

  if (!minimumSkeletonElapsed) return <ShellSkeleton variant="console" />;

  return (
    <>
      <PortalHeader
        homeHref={homeHref}
        profileHref={profileHref}
        menuLabel={menuLabel}
        sidebarId="console-sidebar"
        onOpenMenu={() => setMenuOpen(true)}
        menuOpen={menuOpen}
        menuButtonRef={menuButtonRef}
        onRequestLogout={() => setConfirmLogout(true)}
        consoleLabel={consoleLabel}
        consoleSub={consoleSub}
      />

      <div className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside id="console-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label={menuLabel} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className={styles.sidebarHead}>
          <Logo href={homeHref} badge />
        </div>
        <nav className={styles.nav}>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={22} strokeWidth={1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <button
            type="button"
            className={styles.logoutLink}
            onClick={() => {
              setMenuOpen(false);
              setConfirmLogout(true);
            }}
          >
            <Icon name="log-out" size={22} strokeWidth={1.6} /> Logout
          </button>
        </div>
      </aside>

      <main id="main" className="portal-bg">
        {children}
      </main>

      <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={doLogout} />
    </>
  );
}