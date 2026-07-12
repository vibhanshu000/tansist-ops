import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

// Generic client-side sort hook. Pass the raw list; get back sorted list + header helpers.
export function useSort<T extends Record<string, any>>(items: T[], initialKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const copy = [...items];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    if (sortDir === "desc" && typeof (copy[0]?.[sortKey]) === "number") {
      // number comparator above already ascending; reverse for desc
      copy.reverse();
    }
    return copy;
  }, [items, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}
