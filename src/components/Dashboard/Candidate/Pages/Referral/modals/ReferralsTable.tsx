import React, { memo, useMemo, useState } from "react";
import { ReferralApiResponse, ReferralDetailsDto, PaginationInfo } from "./ReferralTypes";
import { DynamicTable } from "@Components/Shared/DynamicTable";

interface ReferralsTableProps {
  data: ReferralApiResponse | null;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

const ReferralsTable = memo(
  ({ data, pagination, currentPage, onPageChange, onPageSizeChange }: ReferralsTableProps) => {
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const referrals = data?.data || [];

    const columns = [
      {
        key: "candidateName",
        label: "Candidate",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          <span className="font-semibold capitalize">{row.candidateName}</span>
        ),
      },
      {
        key: "referredJobTitle",
        label: "Job Title",
        sortable: true,
      },
      {
        key: "companyName",
        label: "Company",
        sortable: true,
      },
      {
        key: "createdAt",
        label: "Referral Date",
        sortable: true,
        render: (row: ReferralDetailsDto) => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              row.status === "ACCEPTED"
                ? "bg-green-100 text-green-600"
                : row.status === "PENDING"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-red-100 text-red-500"
            }`}
          >
            {row.status}
          </div>
        ),
      },
    ];

    const handlePageSizeChange = (newPageSize: number) => {
      setPageSize(newPageSize);
      onPageSizeChange(newPageSize);
    };

    const sortData = (rows: ReferralDetailsDto[], field: string) => {
      if (!field) return rows;
      return [...rows].sort((a: any, b: any) => {
        let aValue = a[field];
        let bValue = b[field];
        if (field === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    };

    const handleSortChange = (columnKey: string) => {
      if (sortField === columnKey) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(columnKey);
        setSortOrder("asc");
      }
    };

    const sortedData = useMemo(() => sortData(referrals, sortField), [referrals, sortField, sortOrder]);

    return (
      <div className="w-full font-poppins">
        <div className="bg-white shadow-md h-full rounded-xl overflow-hidden">
          <DynamicTable
            columns={columns}
            rows={sortedData}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={pagination?.count > currentPage * pageSize}
            enableSelect={false}
            emptyStateMessage="No referrals found"
            emptyStateSubMessage="Try adjusting your search filters"
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    );
  }
);

ReferralsTable.displayName = "ReferralsTable";

export default ReferralsTable;
