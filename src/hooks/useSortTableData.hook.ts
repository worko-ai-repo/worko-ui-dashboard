import { DashboardTableSortOrder, SortTable } from "@Utils/SortTable.utils";
import { useMemo, useState } from "react";

export function useSortableData<T>(
    data: T[],
    fallbackKeys: Record<string, string[]>
  ) {
    const [sortConfig, setSortConfig] = useState<{ key: string; order: DashboardTableSortOrder } | null>(null);
  
    const sortedData = useMemo(() => {
      if (!sortConfig) return data;
  
      const key = sortConfig.key;
      const keysToTry = fallbackKeys[key] || [key];
  
      return SortTable(data, keysToTry, sortConfig.order);
    }, [data, sortConfig, fallbackKeys]);
  
    const onSortChange = (key: string) => {
      setSortConfig((prev) =>
        prev?.key === key
          ? { key, order: prev.order === "asc" ? "desc" : "asc" }
          : { key, order: "asc" }
      );
    };
  
    return { sortedData, sortConfig, onSortChange };
  }