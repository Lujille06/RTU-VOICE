"use client";

import type { ReactNode } from "react";
import { ConsoleShell, type ConsoleNavItem } from "../admin/ConsoleShell";

const NAV: ConsoleNavItem[] = [
  { href: "/department", label: "Dashboard", icon: "grid" },
  { href: "/department/needs-attention", label: "Needs Attention", icon: "alert-triangle" },
  { href: "/department/complaints", label: "Total Complaints", icon: "list" },
  { href: "/department/assigned", label: "Assigned", icon: "flag" },
  { href: "/department/in-progress", label: "In Progress", icon: "clock" },
  { href: "/department/resolved", label: "Resolved", icon: "check" },
  { href: "/department/statistics", label: "Statistics", icon: "bar-chart" },
];

export function DepartmentShell({ children, departmentName }: { children: ReactNode; departmentName?: string }) {
  return (
    <ConsoleShell
      nav={NAV}
      homeHref="/department"
      profileHref="/department/profile"
      consoleLabel="Department Portal"
      consoleSub={departmentName}
      menuLabel="Department menu"
    >
      {children}
    </ConsoleShell>
  );
}