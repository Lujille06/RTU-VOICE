// src/app/(portal)/dashboard/page.tsx
// Server component: real user from the session, real recent-resolved list from the database.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { getRecentResolvedPublic } from "@/actions/studentActions";
import { requireRole } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatMonthDay } from "@/lib/format";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const me = await requireRole("student");

  const supabase = await createClient();
  const [res, { data: cats }] = await Promise.all([
    getRecentResolvedPublic(),
    supabase.from("categories").select("id, category"),
  ]);

  const categoryNames = new Map<number, string>((cats ?? []).map((c): [number, string] => [c.id, c.category]));

  // ADJUST THIS MAPPING to the real fields of RecentResolvedRow (see the note in the reply).
  const recentResolved = (res.success ? res.data ?? [] : []).slice(0, 3).map((r) => ({
    id: r.id,
    title: r.ai_title,
    category: categoryNames.get(r.category_id) ?? "",
    date: r.created_at,
  }));

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Welcome back, {me.firstName ?? "there"}</h1>
        <p className="page-subtitle">What would you like to do today?</p>
      </div>

      <div className={styles.actions}>
        <section className={`card ${styles.action}`} aria-labelledby="file-title">
          <span className={`${styles.actionIcon} ${styles.iconYellow}`}>
            <Icon name="file-text" size={30} strokeWidth={1.6} />
          </span>
          <div className={styles.actionBody}>
            <h2 id="file-title" className={styles.actionTitle}>
              File a new complaint
            </h2>
            <p className={styles.actionText}>Raise a campus concern in a few minutes. You&apos;ll get a tracking ID right away.</p>
            <Link href="/report" className="btn btn-yellow">
              Report an incident
            </Link>
          </div>
        </section>

        <section className={`card ${styles.action}`} aria-labelledby="track-title">
          <span className={`${styles.actionIcon} ${styles.iconBlue}`}>
            <Icon name="search" size={30} strokeWidth={1.8} />
          </span>
          <div className={styles.actionBody}>
            <h2 id="track-title" className={styles.actionTitle}>
              Track an existing complaint
            </h2>
            <p className={styles.actionText}>Enter your tracking ID to see the status and any update from the department.</p>
            <Link href="/track" className="btn btn-primary">
              Open status tracker
            </Link>
          </div>
        </section>
      </div>

      <section className={`panel ${styles.recent}`} aria-labelledby="recent-title">
        <div className={styles.recentHead}>
          <div>
            <h2 id="recent-title" className={styles.recentTitle}>
              Recent resolved complaints
            </h2>
            <p className={styles.recentSub}>Shared by students on the public dashboard</p>
          </div>
          <Link href="/public-dashboard?status=Resolved" className={styles.viewAll}>
            View all <Icon name="arrow-right" size={14} strokeWidth={2.4} />
          </Link>
        </div>
        {!res.success ? (
          <p className={styles.empty} role="alert">
            Couldn&apos;t load recent resolved complaints. Please refresh to try again.
          </p>
        ) : recentResolved.length === 0 ? (
          <p className={styles.empty}>No resolved complaints have been shared yet.</p>
        ) : (
          <ul className={styles.recentList}>
            {recentResolved.map((c) => (
              <li key={c.id} className={styles.recentItem}>
                <div className={styles.recentText}>
                  <span className={styles.itemTitle}>{c.title}</span>
                  <span className={styles.itemMeta}>
                    {c.category} • {formatMonthDay(c.date)}
                  </span>
                </div>
                <StatusBadge status="Resolved" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}