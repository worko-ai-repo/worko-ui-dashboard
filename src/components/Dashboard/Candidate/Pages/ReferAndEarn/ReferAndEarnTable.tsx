import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { useState, useEffect, useMemo } from "react";
import { Column, NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import WithdrawDialog from "./WithdrawDialog";

const ReferralsTable = ({
  referrals,
  pagination,
  currentPage,
  isLoading,
  error,
  onPageChange,
  onPageSizeChange,
}: {
  referrals: any[];
  pagination: any;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [lastKeyMap, setLastKeyMap] = useState<Record<number, string>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // const fetchReferrals = async (page = 1, pageSize = 25) => {
  //   if (!user?.email) {
  //     setError("User email is not available");
  //     setIsLoading(false);
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     const lastKey = page > 1 ? lastKeyMap[page - 1] : undefined;
  //     const lastKeyParam = lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : "";
  //     const encodedEmail = encodeURIComponent(user.email);

  //     const { response }: { response: any } = await httpServiceObj.get(
  //       `/refer-and-earn?referrerEmail=${encodedEmail}&pageSize=${pageSize}${lastKeyParam}&searchText=${searchbarText || ""}`,
  //       true,
  //       {},
  //       false,
  //        "JOB",
  //     );
  //     console.log(response)
  //     if (!response?.data || !Array.isArray(response.data)) {
  //       setReferrals([]);
  //       setPagination(prev => ({
  //         ...prev,
  //         count: 0,
  //         lastKey: undefined,
  //       }));
  //       return;
  //     }

  //     const formatted = response.data
  //       .map((item: any) => ({
  //         id: item.id || `temp-${Math.random()}`,
  //         name: item.recipientDetails?.name || "N/A",
  //         jobTitle: item.jobDetails?.title || "N/A",
  //         email: item.recipientDetails?.email || "N/A",
  //         phone: item.recipientDetails?.phoneNumber || "N/A",
  //         jobApplicationStatus: item.jobApplicationStatus,
  //         dateReferred: item.referredDate
  //           ? new Date(item.referredDate).toLocaleDateString("en-GB")
  //           : "N/A",
  //         dateApplied: item.jobApplicationStatus && item.updatedAt
  //           ? new Date(item.updatedAt).toLocaleDateString("en-GB")
  //           : "----",
  //         status: item.status || "PENDING",
  //         referralBonus: item.commissionAmount || 0,
  //       }))
  //       .filter(Boolean);

  //     setReferrals(formatted);

  //     if (response?.pagination?.lastKey) {
  //       setLastKeyMap(prev => ({ ...prev, [page]: response.pagination.lastKey }));
  //     }

  //     setPagination({
  //       count: response?.pagination?.count || formatted.length,
  //       pageSize,
  //       sortOrder: "descending",
  //       timesQueried: response?.pagination?.timesQueried || 1,
  //       queriedCount: response?.pagination?.queriedCount || 0,
  //       lastKey: response?.pagination?.lastKey,
  //     });
  //   } catch (error: any) {
  //     console.error("Error fetching referrals:", error);
  //     setError("Failed to load referrals. Please try again.");
  //     setReferrals([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchReferrals(currentPage, pagination.pageSize);
  // }, [user?.email, currentPage, pagination.pageSize, searchbarText]);

  // const handlePageChange = (page: number) => setCurrentPage(page);
  // const handlePageSizeChange = (pageSize: number) => {
  //   setPagination(prev => ({ ...prev, pageSize }));
  //   setCurrentPage(1);
  //   setLastKeyMap({});
  // };

  const getStatusLabelAndStyle = (status: string) => {
    const map: Record<string, { label: string; style: string }> = {
      NOT_ACHIEVED_YET: { label: "Not Achieved Yet", style: "text-[#0f172a]" },
      ACHIEVED: { label: "Hired", style: "text-[#0f172a]" },
      WITHDRAWAL_REQUESTED: { label: "Withdrawal Requested", style: "text-[#0f172a]" },
      WITHDRAWAL_ACCEPTED: { label: "Withdrawal Accepted", style: "bg-[#d6e2ff] text-[#0f172a]" },
      WITHDRAWAL_REJECTED: { label: "Withdrawal Rejected", style: "text-[#0f172a]" },
      PAYMENT_COMPLETED: { label: "Payment Completed", style: "text-[#0f172a]" },
      PENDING: { label: "Pending", style: "text-[#0f172a]" },
      IN_PROCESS: { label: "In Process", style: "text-[#0f172a]" },
      BONUS_ACHIEVED: { label: "Bonus Achieved", style: "text-[#0f172a]" },
      CLOSED: { label: "Cancelled/Closed", style: "text-[#0f172a]" },
      APPLIED: { label: "Applied", style: "text-blue-600" },
      PROCESSING_INTERVIEW: { label: "Interviewing", style: "text-indigo-600" },
      HIRED: { label: "Hired", style: "text-green-600" },
      JOINED: { label: "Joined", style: "text-emerald-700 font-medium" },
      REJECTED: { label: "Rejected", style: "text-red-700 font-medium" },
    };
    return map[status] || { label: "Unknown", style: "text-[#0f172a]" };
  };

  const getBonusColor = (status: string) =>
    status === "PAYMENT_COMPLETED"
      ? "text-green-600"
      : ["WITHDRAWAL_REJECTED", "CANCELLED", "CLOSED"].includes(status)
      ? "text-red-600"
      : status === "ACHIEVED"
      ? "text-blue-600"
      : "text-yellow-600";

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex justify-center m-auto w-[150px]">
          <span className="truncate block w-full" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "jobTitle",
      label: "Job Title",
      sortable: true,
      render: (row: any) => (
        <div className="flex justify-center m-auto w-[150px]">
          <span className="truncate block w-full" title={row.jobTitle}>
            {row.jobTitle}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: any) => (
        <div className="flex justify-center m-auto w-[150px]">
          <span className="truncate block w-full" title={row.email}>
            {row.email?.toLowerCase()}
          </span>
        </div>
      ),
    },

    { key: "phone",
      label: "Phone" , 
      sortable:true,
      render: (row: any) => (
        <div className="flex justify-center m-auto w-[150px]">
          <span className="truncate block w-full" 
            title={row?.phone}>
            +91 {row?.phone?? ""}
          </span>
        </div>
      ),
    },
    { key: "dateReferred", label: "Date Referred", sortable: true },
    { key: "dateApplied", label: "Date Applied", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: any) => {
        if (row.jobApplicationStatus === "JOINED" || row.jobApplicationStatus === "HIRED") {
          return (
            <div className="flex justify-center m-auto w-[150px]">
              <button
                className="w-32 px-4 py-3 text-sm text-white bg-green-600 rounded-full hover:bg-green-700"
                onClick={() => {
                  setSelectedReferral(row);
                  setStatusData({
                    id: row.id,
                    dateApplied: row.dateApplied,
                    dateReferred: row.dateReferred,
                    email: row.email,
                    jobApplicationStatus: row.jobApplicationStatus,
                    jobTitle: row.jobTitle,
                    name: row.name,
                    phone: row.phone,
                    referralBonus: row.referralBonus,
                    status: row.status,
                  });
                  // console.log(row);
                  setShowDialog(true);
                }}>
                Achieved
              </button>
            </div>
          );
        }
        if (row.jobApplicationStatus === "REJECTED") {
          return (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="px-4 py-3 text-sm text-white bg-red-600 rounded-full w-32 text-center truncate">
                Rejected
              </div>
            </div>
          );
        }
        // if (row.jobApplicationStatus === "PENDING" || row.jobApplicationStatus === "PROCESSING_INTERVIEW") {
        return (
          <div className="flex justify-center m-auto w-[150px]">
            <div className=" px-4 py-3 text-sm text-blue-500 bg-blue-100 rounded-full w-32 text-center truncate">
              Not Achieved Yet
            </div>
          </div>
        );
        // }
        // const statusInfo = getStatusLabelAndStyle(row.status);
        // return (
        //   <div className={`px-4 py-3 rounded-full border flex justify-center m-auto w-[150px] ${statusInfo.style}`}>
        //     <span className="text-xs">{statusInfo.label}{"fdgfgdfdg"}</span>
        //   </div>
        // );
      },
    },
    {
      key: "jobApplicationStatus",
      label: "Job Status",
      sortable: true,
      render: (row: any) => {
        const { label, style } = getStatusLabelAndStyle(row.jobApplicationStatus);
        return (
          <div className={`px-4 py-3 rounded-full border ${style}`}>
            <span className="text-xs">{label}</span>
          </div>
        );
      },
    },
    {
      key: "referralBonus",
      label: "Referral Bonus",
      render: (row: any) => (
        <div className={`flex justify-center items-center ${getBonusColor(row.status)}`}>
          <span className="font-semibold">Rs. {row.referralBonus || 0}</span>
        </div>
      ),
    },
  ];

  const sortedData = useMemo(() => {
    if (!sortField) return referrals;
    return [...referrals].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";
      if (sortField.includes("date")) {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [referrals, sortField, sortOrder]);

  const handleSortChange = (columnKey: string) => {
    if (sortField === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(columnKey);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">Loading referrals...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow">
          <NewDynamicTable
            columns={columns}
            rows={sortedData}
            pageSize={pagination.pageSize}
            setPageSize={onPageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={!!pagination.lastKey}
            emptyStateMessage={error || "No referrals found"}
            emptyStateSubMessage={error ? "Please try again." : "Try adjusting your filters"}
            // isLoading={isLoading}
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            enableSelect={false}
            // keyExtractor={(row: any) => row.id}
          />
        </div>
      )}
      <WithdrawDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        referral={selectedReferral}
        statusData={statusData}
      />
    </div>
  );
};

export default ReferralsTable;
