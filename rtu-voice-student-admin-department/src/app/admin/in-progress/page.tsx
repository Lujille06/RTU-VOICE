// src/app/admin/in-progress/page.tsx (replaces page_fb95c3.tsx)
import type { Metadata } from "next";
import { AdminListPage } from "@/components/admin/AdminListPage";
import type { SearchParamsInput } from "@/features/admin/adminUi";

export const metadata: Metadata = { title: "In progress" };

export default function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  return <AdminListPage kind="progress" searchParams={searchParams} />;
}