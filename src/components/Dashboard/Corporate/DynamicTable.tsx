import React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export interface Column<T> {
  key: keyof T & string | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DynamicTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  selectedRows?: string[];
  expandedRows?: string[];
  toggleSelectAll?: () => void;
  toggleRow?: (id: string) => void;
  toggleExpand?: (id: string) => void;
  allSelected?: boolean;
  renderExpandedDetails?: (row: T) => React.ReactNode;
  enableSelect?: boolean;
}

export function DynamicTable<T extends { id: string }>({
  columns,
  rows,
  selectedRows = [],
  expandedRows = [],
  toggleSelectAll,
  toggleRow,
  toggleExpand,
  allSelected = false,
  renderExpandedDetails,
  enableSelect = true,
}: DynamicTableProps<T>) {
  const totalCols = columns.length + (enableSelect ? 1 : 0);

  const getCellValue = (row: T, col: Column<T>): React.ReactNode => {
    const value = row[col.key as keyof T];
    return col.render
      ? col.render(row)
      : typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? value.toString()
        : "-";
  };

  return (
    <div className="bg-white rounded-lg p-2 md:p-4 overflow-x-auto w-full">
      <table className="min-w-full table-auto">
        <thead className="bg-[#EFFFFF] text-[#94A3B8]">
          <tr>
            {enableSelect && (
              <th className="p-3 text-center rounded-l-xl">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-sm whitespace-nowrap text-center font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr><td colSpan={totalCols} className="h-2" /></tr>
          {rows.map((row, rowIndex) => {
            const isSelected = selectedRows.includes(row.id);
            const isExpanded = expandedRows.includes(row.id);
            const baseBg = isSelected ? "bg-[#F5F7F7]" : "bg-[#FCFCFC]";

            return (
              <React.Fragment key={row.id}>
                {rowIndex > 0 && <tr><td colSpan={totalCols} className="h-2" /></tr>}

                <tr>
                  {/* Checkbox column */}
                  {enableSelect && (
                    <td
                      className={`p-3 text-center border-b rounded-tl-xl ${baseBg} ${
                        isSelected ? "border-l-4 border-blue-500 border-b-gray-200" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow?.(row.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}

                  {/* Data columns */}
                  {columns.map((col, index) => {
                    const isFirstVisibleColumn = !enableSelect && index === 0;
                    return (
                      <td
                        key={col.key}
                        className={`px-4 border-b py-4 text-sm whitespace-nowrap capitalize ${baseBg}
                          ${index === columns.length - 1 ? "rounded-tr-xl" : ""}
                          ${isFirstVisibleColumn ? "rounded-tl-xl" : ""}
                          ${
                            isSelected && isFirstVisibleColumn
                              ? "border-l-4 border-blue-500"
                              : ""
                          }`}
                      >
                        {getCellValue(row, col)}
                      </td>
                    );
                  })}
                </tr>

                {/* Expand Button */}
                {renderExpandedDetails && !isExpanded && (
                  <tr className="relative h-0">
                    <td colSpan={totalCols} className="p-0 border-t-0">
                      <div
                        onClick={() => toggleExpand?.(row.id)}
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-blue-600 border rounded-full bg-white shadow-md cursor-pointer"
                      >
                        <ChevronDownIcon />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded Content */}
                {renderExpandedDetails && isExpanded && (
                  <>
                    <tr>
                      <td
                        colSpan={totalCols}
                        className="relative bg-white p-0 text-sm text-gray-600"
                      >
                        <div className="p-4 border border-t-0 rounded-b-xl">
                          {renderExpandedDetails(row)}
                        </div>
                        <div
                          onClick={() => toggleExpand?.(row.id)}
                          className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 z-10 w-8 h-8 text-blue-600 flex items-center justify-center bg-white border shadow-md rounded-full cursor-pointer"
                        >
                          <ChevronUpIcon />
                        </div>
                      </td>
                    </tr>
                    <tr><td colSpan={totalCols} className="h-4" /></tr>
                  </>
                )}

              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
