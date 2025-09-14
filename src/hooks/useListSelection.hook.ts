import { getToastOptions } from "@Utils/Toast.utils";
import { useState } from "react";
import { toast } from "react-toastify";

type useListSelectionParams<T, U> = {
  limit?: number; // Maximum number of items that can be selected
  mapFn: (item: T) => U; // How to map the item to the selected type
  keySelector: (item: U) => string; // How to get a unique key from the selected type
};

export function useListSelection<T, U>({
  limit = 30,
  mapFn,
  keySelector,
}: useListSelectionParams<T, U>) {
  const [selectedRows, setSelectedRows] = useState<U[]>([]);

  const toggleRow = (item: T) => {
    const mapped = mapFn(item);
    const key = keySelector(mapped);
    setSelectedRows((prev) => {
      const alreadySelected = prev.some((r) => keySelector(r) === key);
      if (alreadySelected) {
        return prev.filter((r) => keySelector(r) !== key);
      }
      if (prev.length >= limit) {
        toast.warning(`You can only select up to ${limit} items.`, getToastOptions());
        return prev;
      }
      return [...prev, mapped];
    });
  };

  const toggleSelectAll = (items: T[]) => {
    const mapped = items.slice(0, limit).map(mapFn);
    setSelectedRows((prev) => (prev.length === mapped.length ? [] : mapped));
  };

  const isSelected = (item: T) => {
    const key = keySelector(mapFn(item));
    return selectedRows.some((r) => keySelector(r) === key);
  };

  // Add a function to calculate if all available items are selected
  const getAllSelected = (items: T[]): boolean => {
    const maxSelectableItems = Math.min(items.length, limit);
    return selectedRows.length === maxSelectableItems && items.length > 0;
  };

  const reset = () => setSelectedRows([]);

  return {
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isSelected,
    getAllSelected, // Add this new function
    reset,
  };
}
