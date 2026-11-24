// src/app/admin/assigned/page.tsx (replaces page_d99d02.tsx)
import type { Metadata } from "next";
import { AdminListPage } from "@/components/admin/AdminListPage";
import type { SearchParamsInput } from "@/features/admin/adminUi";

export const metadata: Metadata = { title: "Assigned" };

export default function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  return <AdminListPage kind="assigned" searchParams={searchParams} />;
}