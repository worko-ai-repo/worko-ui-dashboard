import { useDashboardContext } from "@Context/CandidateDashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { useState, useEffect } from "react";
import Table from "../../SharedComponents/Table";

const ReferralsTable = ({searchbarText}: any) => {
  const { user } = useDashboardContext();
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI;
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!user?.email) return;
    
    setLoading(true);
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

      const formatted = response?.data.map((item:any) => ({
        id: item.id,
        name: item.recipientDetails?.name || "N/A",
        jobTitle: item.jobDetails?.title || "N/A",
        email: item.recipientDetails?.email || "N/A",
        phone: item.recipientDetails?.phoneNumber || "N/A",
        dateReferred: new Date(item.referredDate).toLocaleDateString("en-GB"),
        dateApplied: item.jobApplicationStatus
          ? new Date(item.updatedAt).toLocaleDateString("en-GB")
          : "----",
        status: item.status || "PENDING",
        referralBonus: item.commissionAmount,
      }));

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
        lastKey: response?.pagination.lastKey // Store lastKey in pagination state
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
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
    return map[status];
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
          <span className="font-semibold">Rs. {value}</span>
        </div>
      )
    }
  ];

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
            <div className="w-full p-8 text-center">
              <p className="text-gray-500">No referrals found</p>
            </div>
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