// src/app/admin/complaints/page.tsx (replaces page_fe2887.tsx)
import type { Metadata } from "next";
import { AdminListPage } from "@/components/admin/AdminListPage";
import type { SearchParamsInput } from "@/features/admin/adminUi";

export const metadata: Metadata = { title: "Total complaints" };

export default function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  return <AdminListPage kind="total" searchParams={searchParams} />;
}