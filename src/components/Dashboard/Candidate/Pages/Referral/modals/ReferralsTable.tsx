import React, { memo, useMemo, useState } from "react";
import {ReferralApiResponse,ReferralDetailsDto,PaginationInfo,} from "./ReferralTypes";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import { chat } from "@AssetsFolder/assets";
import WithdrawRefferralModal from "./WithdrawRefferralModal";

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
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawComments, setWithdrawComments] = useState('');

    const referrals = data?.data || [];

    const keyExtractor = (item: ReferralDetailsDto) =>
      item.id?.toString() ?? Math.random().toString();
    
    const handleWithdrawReferral = (row: ReferralDetailsDto) => {
        if (!withdrawReason) {
        alert("Please select a reason.");
        return;
      }

      console.log("Reason:", withdrawReason);
      console.log("Comments:", withdrawComments);

      // TODO: Make API call or handle form submission

      setShowWithdrawModal(false); // Close modal
    };

    const columns = [
      {
        key: "companyName",
        label: "Company Name",
        sortable: true,
      },
      {
        key: "referredJobURL",
        label: "Job URL",
        sortable: true,
      },
      {
        key: "createdAt",
        label: "Request Date",
        sortable: true,
        render: (row: ReferralDetailsDto) =>
          new Date(row.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      },
      {
        key: "matchingScore",
        label: "Matching Score",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
            <div className="flex justify-center">
              <MatchingScoreCircle score={row.matchingScore} />
            </div>
          ),
      },
      {
        key: "status",
        label: "Current Status",
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
      {
        key: "chat",
        label: "Chat",
        render: (row: ReferralDetailsDto) =>
        row.status === "ACCEPTED" ? (
          <div className="flex justify-center">
            <a href={`/chat/${row.chatId ?? ""}`} className="text-blue-600 hover:underline">
              <img src={chat} alt="" />
            </a>
          </div>
        ) : row.status === "AWAITING" ? (
            <div className="flex justify-center">
              <button
                onClick={()=>handleWithdrawReferral(row)}
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors rounded-full px-3 py-1 text-sm font-medium"
              >
                Withdraw referral
              </button>
            </div>
        ) : null,
      },
      {
        key: "refereeName",
        label: "Referee Name",
        render: (row: ReferralDetailsDto) => row.refereeName ?? "N/A",
      },
    ];

    const handlePageSizeChange = (newPageSize: number) => {
      setPageSize(newPageSize);
      onPageSizeChange(newPageSize);
    };

    const sortData = (
      rows: ReferralDetailsDto[],
      field: string
    ): ReferralDetailsDto[] => {
      if (!field) return rows;

      return [...rows].sort((a, b) => {
        let aValue = (a as any)[field];
        let bValue = (b as any)[field];

        if (field === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          // to handle empty undefined and null names
          aValue = aValue ?? "";
          bValue = bValue ?? "";

          if (typeof aValue === "string") aValue = aValue.toLowerCase();
          if (typeof bValue === "string") bValue = bValue.toLowerCase();
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

    const sortedData = useMemo(
      () => sortData(referrals, sortField),
      [referrals, sortField, sortOrder]
    );

    
      const MatchingScoreCircle = memo(({ score }: { score: number }) => (
        <div className="w-20 flex mb-2 flex-col items-center justify-center gap-px text-base text-green-500">
          <div className="w-16 relative h-16 cursor-pointer flex items-center justify-center">
            <svg className="absolute scale-[80%]" width="65" height="65" viewBox="0 0 65 65">
              <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#eee" strokeWidth="5" />
              <circle 
                cx="32.5" 
                cy="32.5" 
                r="30" 
                fill="none" 
                stroke="#4cbc9a" 
                strokeWidth="5"
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                transform="rotate(-90 32.5 32.5)"
              />
            </svg>
            <div className="absolute font-semibold text-xs">{score}%</div>
          </div>
          <span className="absolute top-14 pt-1 text-[9px] font-semibold text-gray-500 text-center">View details</span>
        </div>
      ));

    return (
      <div className="w-full font-poppins">
        <div className="bg-white shadow-md h-full rounded-xl overflow-hidden">
          <DynamicTable<ReferralDetailsDto>
            columns={columns}
            rows={sortedData}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={!!pagination?.lastKey}
            emptyStateMessage="No referrals found"
            emptyStateSubMessage="Try adjusting your filters"
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            enableSelect={false}
            keyExtractor={keyExtractor}
          />
            {showWithdrawModal && (
            <WithdrawRefferralModal
              reason={withdrawReason}
              comments={withdrawComments}
              setReason={setWithdrawReason}
              setComments={setWithdrawComments}
              onSubmit={handleWithdrawReferral}
              onClose={() => setShowWithdrawModal(false)}
            />
          )}
        </div>
      </div>
    );
  }
);

ReferralsTable.displayName = "ReferralsTable";

export default ReferralsTable;
