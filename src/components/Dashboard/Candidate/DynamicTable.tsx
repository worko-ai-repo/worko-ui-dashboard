import React from "react";
import { ChevronDownIcon, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

// @claude: Extended DynamicTableProps to include pagination properties
export interface DynamicTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  activeTab?: string;
  selectedRows: string[];
  expandedRows?: string[];
  toggleSelectAll: () => void;
  toggleRow: (id: string) => void;
  toggleExpand?: (id: string) => void;
  allSelected: boolean;
  renderActions?: (row: T) => React.ReactNode;
  renderExpandedDetails?: (row: T) => React.ReactNode;
  enableSelect?: boolean;
  showExpansionByDefault?: boolean;
  // @claude: Added pagination props
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  totalItems?: number;
  // @claude: Added empty state props
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
}

export function DynamicTable<T extends { id: string; jobTitle: string }>(
  props: DynamicTableProps<T>
) {
  const {
    columns,
    rows,
    activeTab,
    selectedRows,
    expandedRows,
    toggleSelectAll,
    toggleRow,
    toggleExpand,
    allSelected,
    renderActions,
    showExpansionByDefault = true,
    // @claude: Destructured pagination props with defaults
    currentPage = 1,
    totalPages = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    totalItems = 0,
    // @claude: Destructured empty state props with defaults
    emptyStateMessage = "No data available",
    emptyStateSubMessage = "There are no items to display at the moment.",
  } = props;

  const dynamicGridTemplate = `2fr repeat(${columns.length}, 1fr) ${activeTab !== 'Open' ? '1fr' : '2fr'}`;

  // @claude: Added page size options for the dropdown
  const pageSizeOptions = [5, 10, 20, 50, 100];

  // @claude: Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(event.target.value);
    onPageSizeChange?.(newPageSize);
  };

  // @claude: Handle previous page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  // @claude: Handle next page navigation
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  // @claude: Render empty state when no rows are available
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg p-2 md:p-4">
        <div
          className="hidden md:grid relative items-center p-4 mb-2 rounded-lg bg-[#EFFFFF] text-[#94A3B8] font-medium"
          style={{ gridTemplateColumns: dynamicGridTemplate }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 absolute left-4"
          />
          <div>Job title</div>
          {columns.map((col) => (
            <div key={col.key as string} className={col.hideOnMobile ? "hidden md:block" : ""}>
              {col.label}
            </div>
          ))}
          <div>Actions</div>
        </div>
        
        {/* @claude: Empty state component */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateMessage}</h3>
          <p className="text-sm text-gray-500">{emptyStateSubMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-2 md:p-4">
      <div
        className="hidden md:grid relative items-center p-4 mb-2 rounded-lg bg-[#EFFFFF] text-[#94A3B8] font-medium"
        style={{ gridTemplateColumns: dynamicGridTemplate }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 absolute left-4"
        />
        <div>Job title</div>
        {columns.map((col) => (
          <div key={col.key as string} className={col.hideOnMobile ? "hidden md:block" : ""}>
            {col.label}
          </div>
        ))}
        <div>Actions</div>
      </div>

      {rows.map((row) => {
        const isSelected = selectedRows.includes(row.id);
        const isExpanded = (expandedRows ?? []).includes(row.id);

        return (
          <div key={row.id} className={`relative my-2 md:my-1 ${isExpanded ? "md:my-6" : ""}`}>
            <div
              className={`rounded-md overflow-hidden ${isSelected ? "bg-gray-100 border-l-2 border-blue-600" : "bg-gray-50"
                } ${isExpanded || isSelected ? "border-b-none" : "border-b"}`}
            >
              <div className="p-4 grid gap-2 text-sm" style={{ gridTemplateColumns: dynamicGridTemplate }}>
                <div className="flex flex-col md:flex-row md:items-center md:gap-20 gap-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(row.id)}
                    className="w-4 h-4"
                  />
                  <span className="font-bold capitalize">{row.jobTitle}</span>
                </div>
                {columns.map((col) => (
                  <div key={col.key as string} className="flex items-center justify-center capitalize">
                    {col.hideOnMobile && (
                      <span className="md:hidden text-gray-400 block">{col.label}</span>
                    )}
                    {col.render
                      ? col.render(row)
                      : (row[col.key as keyof T] as React.ReactNode)}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2">
                  {renderActions?.(row)}
                </div>
              </div>
            </div>

            {showExpansionByDefault && (
              <div
                onClick={() => toggleExpand?.(row.id)}
                className="absolute hover:cursor-pointer left-1/2 transform -translate-x-1/2 w-8 h-8 flex items-center justify-center text-blue-600 rounded-full border bg-white shadow-md z-10 bottom-[-1rem]"
              >
                {isExpanded ? <ChevronUp /> : <ChevronDownIcon />}
              </div>
            )}

            {isExpanded && (
              <div className="bg-white p-4 border text-sm text-gray-600 rounded-b-md">
                {props.renderExpandedDetails?.(row)}
              </div>
            )}
          </div>
        );
      })}

      {/* @claude: Added pagination controls container */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-4">
        {/* @claude: Page size selector on the left */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Page size:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* @claude: Page info and navigation controls on the right */}
        <div className="flex items-center gap-4">
          {/* @claude: Page information display */}
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({totalItems} total items)
          </div>
          
          {/* @claude: Previous and Next buttons */}
          <div className="bc flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentPage <= 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentPage >= totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}