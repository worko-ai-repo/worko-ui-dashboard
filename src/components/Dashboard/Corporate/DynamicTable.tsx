import React from "react";
import { ChevronDownIcon, ChevronUp } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DynamicTableProps<T> {
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

export function DynamicTable<T extends { id: string }>(
  props: DynamicTableProps<T>
) {
  const {
    columns,
    rows,
    selectedRows = [],
    expandedRows = [],
    toggleSelectAll = () => { },
    toggleRow = () => { },
    toggleExpand = () => { },
    allSelected = false,
    renderExpandedDetails,
    enableSelect = true,
  } = props;

  const totalCols = columns.length + (enableSelect ? 1 : 0);

  return (
    <div className="bg-white rounded-lg p-2 md:p-4 overflow-x-auto w-full">
      <table className="min-w-full table-auto"> {/* removed border-spacing-y-4 */}
        {/* Table Head */}
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
                key={col.key as string}
                className="px-4 py-2 text-sm whitespace-nowrap text-center font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          <tr><td colSpan={totalCols} className="h-2" /></tr>

          {rows.map((row, rowIndex) => {
            const isSelected = selectedRows.includes(row.id);
            const isExpanded = expandedRows.includes(row.id);

            return (
              <React.Fragment key={row.id}>
                {/* Spacer row before each main row, but NOT before expanded content */}
                {rowIndex > 0 && !expandedRows.includes(rows[rowIndex - 1].id) && (
                  <tr><td colSpan={totalCols} className="h-2" /></tr> // ← custom spacing between rows
                )}

                {/* Main row */}
                <tr>
                  {enableSelect && (
                    <td className={`p-3 text-center border-b ${isSelected ? "bg-[#F5F7F7]" : "bg-[#FCFCFC]"} rounded-tl-xl`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}

                  {columns.map((col, index) => (
                    <td
                      key={col.key as string}
                      className={`px-4 border-b py-4 text-sm whitespace-nowrap capitalize 
                        ${isSelected ? "bg-[#F5F7F7]" : "bg-[#FCFCFC]"} 
                        ${index === columns.length - 1 ? "rounded-tr-xl" : ""} 
                        ${!enableSelect && index === 0 ? "rounded-tl-xl" : ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key as keyof T] as React.ReactNode) ?? "-"}
                    </td>
                  ))}
                </tr>

                {/* Expand Button */}
                {renderExpandedDetails && !isExpanded && (
                  <tr className="relative h-0">
                    <td colSpan={totalCols} className="p-0 border-t-0">
                      <div
                        onClick={() => toggleExpand(row.id)}
                        className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-blue-600 border rounded-full bg-white shadow-md cursor-pointer"
                      >
                        <ChevronDownIcon />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded Content */}
                {renderExpandedDetails && isExpanded && (
                  <>
                    {/* Expanded Content */}
                    <tr>
                      <td
                        colSpan={totalCols}
                        className="relative bg-white p-0 text-sm text-gray-600"
                      >
                        <div className="p-4 border border-t-0 rounded-b-xl">{renderExpandedDetails(row)}</div>

                        <div
                          onClick={() => toggleExpand(row.id)}
                          className="absolute left-1/2 transform -translate-x-1/2 translate-y-1/2 bottom-0 z-10 w-8 h-8 text-blue-600 flex items-center justify-center bg-white border shadow-md rounded-full cursor-pointer"
                        >
                          <ChevronUp />
                        </div>
                      </td>
                    </tr>

                    {/* Spacer row after expanded content */}
                    <tr>
                      <td colSpan={totalCols} className="h-4" />
                    </tr>
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
