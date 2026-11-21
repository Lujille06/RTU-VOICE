import type { Metadata } from "next";
import { DepartmentListPage } from "@/components/department/DepartmentListPage";
import type { SearchParamsInput } from "@/features/admin/adminUi";

export const metadata: Metadata = { title: "Assigned" };

export default function Page({ searchParams }: { searchParams: SearchParamsInput }) {
  return <DepartmentListPage kind="resolved" searchParams={searchParams} />;
}
