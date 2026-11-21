"use client";
// src/components/admin/useUrlFilters.ts  (one version for the admin AND department screens)
// Filters live in the URL, so the server page refetches when they change.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function useUrlFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  /** Change query params. null / undefined / "" removes the param. */
  const update = (next: Record<string, string | number | null | undefined>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === undefined || v === "") q.delete(k);
      else q.set(k, String(v));
    }
    const qs = q.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  /** Re-run the server page's queries (after an assign / status change / update). */
  const refresh = () => start(() => router.refresh());

  // `set` is the same function as `update` (the admin screens call it `set`)
  return { params, update, set: update, refresh, pending };
}

/** Search text that waits for you to stop typing, then calls onSearch with the raw text. */
export function useDebouncedSearch(initial: string, onSearch: (value: string) => void, delay = 350) {
  const [query, setQuery] = useState(initial);
  useEffect(() => {
    if (query === initial) return;
    const t = setTimeout(() => onSearch(query), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  return [query, setQuery] as const;
}