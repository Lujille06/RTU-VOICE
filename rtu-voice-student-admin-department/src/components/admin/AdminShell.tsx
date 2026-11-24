"use client";

import type { ReactNode } from "react";
import { ConsoleShell, type ConsoleNavItem } from "./ConsoleShell";

/** Hamburger menu items, in the order given by the SRS (§3 Admin Portal). */
const NAV: ConsoleNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/complaints", label: "Total Complaints", icon: "list" },
  { href: "/admin/assigned", label: "Assigned", icon: "flag" },
  { href: "/admin/in-progress", label: "In Progress", icon: "clock" },
  { href: "/admin/resolved", label: "Resolved", icon: "check" },
  { href: "/admin/statistics", label: "Statistics", icon: "bar-chart" },
];

/** Layout for every Central Admin Console page. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ConsoleShell nav={NAV} homeHref="/admin" profileHref="/admin/profile" consoleLabel="Central Admin Console" menuLabel="Admin menu">
      {children}
    </ConsoleShell>
  );
}