import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { useState, useEffect } from "react";
import Table from "../../SharedComponents/Table";

const ReferralsTable = ({searchbarText}: any) => {
  const { user } = useDashboardContext();
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI;
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    pageSize: 10,
    sortOrder: "descending",
    timesQueried: 0,
    queriedCount: 0,
    lastKey: undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [lastKeyMap, setLastKeyMap] = useState<Record<number, string>>({});

  const fetchReferrals = async (page = 1, pageSize = 10) => {
    if (!user?.email) {
      setError("User email is not available");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null); // Clear previous errors
    
    try {
      // Include lastKey in the request if it exists for the requested page
      const lastKey = page > 1 ? lastKeyMap[page - 1] : undefined;
      const lastKeyParam = lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : '';
      
      const { response }: {response:any} = await httpServiceObj.get(
        `${APP_JOBS_API_URI}/refer-and-earn?referrerEmail=${user.email}&pageSize=${pageSize}${lastKeyParam}&searchText=${searchbarText || ''}`,
        true,
        {},
        true
      );

      // Check if response exists and has the expected structure
      if (!response) {
        throw new Error("No response received from server");
      }

      // Check if response.data exists and is an array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn("Invalid or missing data in API response:", response);
        setReferrals([]);
        setPagination(prev => ({
          ...prev,
          count: 0,
          timesQueried: (response?.pagination?.timesQueried || 0) + 1,
          queriedCount: 0,
          lastKey: undefined
        }));
        return;
      }

      const formatted = response.data.map((item:any) => {
        // Add null checks for nested objects
        if (!item) {
          console.warn("Null or undefined item in response data");
          return null;
        }

        return {
          id: item.id || `temp-${Math.random()}`, // Fallback ID if missing
          name: item.recipientDetails?.name || "N/A",
          jobTitle: item.jobDetails?.title || "N/A",
          email: item.recipientDetails?.email || "N/A",
          phone: item.recipientDetails?.phoneNumber || "N/A",
          dateReferred: item.referredDate 
            ? new Date(item.referredDate).toLocaleDateString("en-GB")
            : "N/A",
          dateApplied: item.jobApplicationStatus && item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString("en-GB")
            : "----",
          status: item.status || "PENDING",
          referralBonus: item.commissionAmount || 0,
        };
      }).filter(Boolean); // Remove any null items

      setReferrals(formatted);
      
      // Store the lastKey for the current page if it exists
      if (response?.pagination?.lastKey) {
        setLastKeyMap(prev => ({
          ...prev,
          [page]: response.pagination.lastKey
        }));
      }
      
      setPagination({
        count: response?.pagination?.count || formatted.length,
        pageSize: pageSize,
        sortOrder: "descending",
        timesQueried: response?.pagination?.timesQueried || 1,
        queriedCount: response?.pagination?.queriedCount || 0,
        lastKey: response?.pagination?.lastKey // Store lastKey in pagination state
      });

    } catch (error: any) {
      console.error("Error fetching referrals:", error);
      
      // Set user-friendly error message
      let errorMessage = "Failed to load referrals. Please try again.";
      
      if (error?.message) {
        if (error.message.includes("Network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Session expired. Please log in again.";
        } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
          errorMessage = "You don't have permission to view this data.";
        } else if (error.message.includes("404")) {
          errorMessage = "Referrals service not found. Please contact support.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        }
      }
      
      setError(errorMessage);
      setReferrals([]);
      setPagination(prev => ({
        ...prev,
        count: 0,
        lastKey: undefined
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals(currentPage, pagination.pageSize);
  }, [user?.email, currentPage, pagination.pageSize, searchbarText]);

  const handlePageChange = (page:number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize:number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: pageSize
    }));
    setCurrentPage(1); // Reset to page 1 when changing page size
    setLastKeyMap({}); // Clear lastKey map when changing page size
  };

  const handleRetry = () => {
    setError(null);
    fetchReferrals(currentPage, pagination.pageSize);
  };

  const getStatusLabelAndStyle = (status: any) => {
    if (status === undefined || status === null) {
      return { label: "Pending", style: "text-[#0f172a]" };
    }
  
    const map: Record<string, {label: string, style: string}> = {
      WITHDRAWAL_ACCEPTED: { label: "Withdrawal Accepted", style: "bg-[#d6e2ff] text-[#0f172a]" },
      IN_PROCESS: { label: "In process", style: "text-[#0f172a]" },
      ACHIEVED: { label: "Hired", style: "text-[#0f172a]" },
      WITHDRAWAL_REQUESTED: { label: "WITHDRAWAL REQUESTED", style: "text-[#0f172a]" },
      BONUS_ACHIEVED: { label: "Bonus Achieved", style: "text-[#0f172a]" },
      PAYMENT_COMPLETED: { label: "Payment Completed", style: "text-[#0f172a]" },
      WITHDRAWAL_REJECTED: { label: "Withdrawal Rejected", style: "text-[#0f172a]" },
      CLOSED: { label: "Cancelled/Closed", style: "text-[#0f172a]" },
      NOT_ACHIEVED_YET: { label: "Not Achieved Yet", style: "text-[#0f172a]" },
      PENDING: { label: "Pending", style: "text-[#0f172a]" },
    };
    return map[status] || { label: "Unknown", style: "text-[#0f172a]" };
  };

  const getBonusColor = (status:any) =>
    status === "PAYMENT_COMPLETED"
      ? "text-green-600"
      : ["WITHDRAWAL_REJECTED", "CANCELLED", "CLOSED"].includes(status)
      ? "text-red-600"
      : status === "ACHIEVED"
      ? "text-blue-600"
      : "text-yellow-600";

  // Define columns for the table
  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      className: "capitalize font-semibold text-sm text-nowrap"
    },
    {
      key: "jobTitle",
      header: "Job title",
      sortable: true,
      className: "capitalize text-sm"
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      className: "text-sm",
    },
    {
      key: "phone",
      className: "text-sm",
      header: "Phone"
    },
    {
      key: "dateReferred",
      className: "text-sm",
      header: "Date referred",
      sortable: true
    },
    {
      key: "dateApplied",
      className: "text-sm",
      header: "Date applied",
      sortable: true
    },
    {
      key: "status",
      className: "text-xs",
      header: "Status",
      sortable: true,
      render: (value:any) => {
        const statusInfo = getStatusLabelAndStyle(value);
        const { label, style } = statusInfo;
        return (
          <div className={`px-8 py-2 rounded-full border truncate border-gray-300 ${style}`}>
            <span className="text-xs">{label}</span>
          </div>
        );
      }
    },
    {
      key: "referralBonus",
      className: "text-sm",
      header: "Referral bonus",
      render: (value:any, item:any) => (
        <div className={`flex items-center gap-1 ${getBonusColor(item.status)}`}>
          <span className="font-semibold">Rs. {value || 0}</span>
        </div>
      )
    }
  ];

  // Error state component
  const ErrorComponent = () => (
    <div className="w-full p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-red-500 text-lg">⚠️</div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="w-full bg-white rounded-2xl shadow p-4">
        <Table
          data={referrals}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          headerClassName="bg-cyan-50 text-sm rounded-xl text-nowrap py-3 px-4 mb-2"
          rowClassName={() => "w-full rounded-xl hover:bg-gray-50 border-b mb-4"}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          currentPage={currentPage}
          emptyStateComponent={
            error ? (
              <ErrorComponent />
            ) : (
              <div className="w-full p-8 text-center">
                <p className="text-gray-500">No referrals found</p>
              </div>
            )
          }
          loadingComponent={
            <div className="w-full p-8 text-center">
              <p className="text-gray-500">Loading referrals...</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ReferralsTable;