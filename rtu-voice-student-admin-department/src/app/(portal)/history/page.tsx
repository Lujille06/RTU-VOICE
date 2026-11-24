import { createClient } from "@/lib/supabase/server";
import { getHistory } from "@/actions/studentActions";
import type { HistoryRow } from "@/features/student/studentTypes";
import { HistoryTable } from "./HistoryTable";

const NONE_YET = "No complaint submitted yet."; // the message getHistory returns when the RPC gives null

export default async function HistoryPage() {
  const supabase = await createClient();

  const [res, { data: cats }] = await Promise.all([
    getHistory(),
    supabase.from("categories").select("id, category"),
  ]);

  const categoryNames: Record<number, string> = Object.fromEntries(
    (cats ?? []).map((c) => [c.id as number, c.category as string])
  );

  const rows = (res.success && "historyData" in res ? res.historyData : []) as HistoryRow[];
  // "nothing submitted yet" is an empty list, not an error
  const loadError = res.success || res.message === NONE_YET ? null : res.message;

  return <HistoryTable rows={rows} categoryNames={categoryNames} loadError={loadError} />;
}