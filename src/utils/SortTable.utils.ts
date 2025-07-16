function getNestedValue(obj: any, path: string | string[]): any {
  const paths = Array.isArray(path) ? path : [path];

  for (const p of paths) {
    const value = p.split(".").reduce((acc, key) => acc?.[key], obj);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

export type DashboardTableSortOrder = "asc" | "desc";
export function SortTable<T>(
  data: T[],
  key: string | string[], // can be "name" or ["name", "applicantDetails.name"]
  order: DashboardTableSortOrder = "asc"
): T[] {
  return [...data].sort((a, b) => {
    const valA = getNestedValue(a, key);
    const valB = getNestedValue(b, key);

    if (typeof valA === "number" && typeof valB === "number") {
      return order === "asc" ? valA - valB : valB - valA;
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return 0;
  });
}
