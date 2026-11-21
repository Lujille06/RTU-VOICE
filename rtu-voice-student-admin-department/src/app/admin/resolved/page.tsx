// src/app/admin/resolved/page.tsx (replaces page_dfa68d.tsx)
import type { Metadata } from "next";
import { AdminListPage } from "@/components/admin/AdminListPage";
import type { SearchParamsInput } from "@/features/admin/adminUi";

export const metadata: Metadata = { title: "Resolved" };

export default function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  return <AdminListPage kind="resolved" searchParams={searchParams} />;
}