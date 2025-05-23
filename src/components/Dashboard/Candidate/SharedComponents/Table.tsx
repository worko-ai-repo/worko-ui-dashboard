import { dashboardSort } from '@Assets';
import React, { ReactNode, useState } from 'react';

interface TableColumn<T> {
  key: string | ((item: T) => string | ReactNode);
  header: string | ReactNode;
  width?: string;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface PaginationInfo {
  count: number;
  pageSize: number;
  sortOrder: string;
  timesQueried: number;
  queriedCount: number;
  lastKey?: string; // Added lastKey for cursor-based pagination
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  headerClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  expandableContent?: (item: T) => ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  emptyStateComponent?: ReactNode;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage?: number;
}

function getValueByKey<T>(item: T, key: string | ((item: T) => string | ReactNode)): any {
  if (typeof key === 'function') {
    return key(item);
  }
  
  return key.split('.').reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : null, item as any);
}

export const Table = <T extends object>({
  data,
  columns,
  keyExtractor,
  className = '',
  headerClassName = '',
  rowClassName = () => '',
  onRowClick,
  expandableContent,
  isLoading = false,
  loadingComponent = <div className="w-full p-8 text-center">Loading data...</div>,
  emptyStateComponent = <div className="w-full p-8 text-center">No data available</div>,
  pagination,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
}: TableProps<T>) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedPageSize, setSelectedPageSize] = useState<number>(pagination?.pageSize || 10);
  
  const toggleRow = (id: string) => {
    if (expandableContent) {
      setExpandedRows(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (expandableContent) {
      toggleRow(keyExtractor(item));
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSelectedPageSize(pageSize);
    if (onPageSizeChange) {
      onPageSizeChange(pageSize);
    }
  };

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (!data.length) {
    return <>{emptyStateComponent}</>;
  }

  // Check if there's a next page based on lastKey
  const hasNextPage = pagination?.lastKey !== undefined;
  
  const SortIcon = () => (
   <img src={dashboardSort} alt="Sort" />
  );

  const pageSizeOptions = [10, 25, 50, 100, 150, 200, 250];

  return (
    <div className="flex flex-col h-full relative">
      {/* Table container with scrollable content */}
      <div className={`w-full rounded-xl relative overflow-x-auto overflow-y-hidden ${className}`}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className={`${headerClassName} font-sans font-stretch-50% text-[#94A3B8]`}>
              {columns.map((column, colIndex) => (
                <th
                  key={colIndex}
                  className={`py-3 px-4 text-left ${column.headerClassName || ''}`}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="flex items-center justify-center gap-2">
                    {column.header}
                    {column.sortable && <SortIcon />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => {
              const rowKey = keyExtractor(item);
              const isExpanded = expandedRows[rowKey];
              
              return (
                <React.Fragment key={rowKey}>
                  <tr
                    className={`${rowClassName(item, rowIndex)} ${onRowClick || expandableContent ? 'cursor-pointer' : ''}`}
                    onClick={() => handleRowClick(item)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = getValueByKey(item, column.key);
                      return (
                        <td
                          key={`${rowKey}-${colIndex}`}
                        className={`py-2 px-4 ${column.className || ''}`}
                        >
                          {column.render ? column.render(value, item, rowIndex) : value}
                        </td>
                      );
                    })}
                  </tr>
                  {isExpanded && expandableContent && (
                    <tr>
                      <td colSpan={columns.length} className="p-0">
                        {expandableContent(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination UI */}
      {pagination && (
        <div className="w-full rounded-t-3xs rounded-br-[35px] rounded-bl-3xs bg-white h-[58px] flex flex-row items-center justify-between px-4 mt-2 text-left text-base text-[#0f172a] font-Heading-H5 z-10">
          <div className="flex flex-row items-center justify-start gap-4">
            <div className="relative tracking-[0.2px] leading-[150%] font-semibold">Show rows:</div>
            <div className="relative">
              <select 
                className="rounded-xl border-[#e2e8f0] border-solid border-[1px] box-border h-12 flex flex-row items-center justify-start py-3 px-4 gap-4 text-sm text-[#94a3b8] appearance-none cursor-pointer pr-8"
                value={selectedPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size} items</option>
                ))}
              </select>
              <div className="absolute right-3 top-4 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row items-center justify-end gap-6 text-center text-lg text-[#94a3b8]">
            <button 
              className="w-12 relative rounded-xl h-12 overflow-hidden shrink-0 flex items-center justify-center border-[#e2e8f0] border-solid border-[1px]"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
                <path d="M9 18L15 12L9 6" stroke={currentPage === 1 ? "#E2E8F0" : "#222831"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="w-12 relative rounded-xl bg-[#316bff] border-aliceblue border-solid border-[1px] box-border h-12 overflow-hidden shrink-0 text-white">
              <span className="absolute top-[12px] left-[20px] tracking-[0.2px] leading-[140%]">{currentPage}</span>
            </div>
            
            <button 
              className="w-12 relative rounded-xl h-12 overflow-hidden shrink-0 flex items-center justify-center border-[#e2e8f0] border-solid border-[1px]"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke={!hasNextPage ? "#E2E8F0" : "#222831"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;