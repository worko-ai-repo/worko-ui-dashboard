import { useState, useEffect, useMemo } from "react";
import { JobApiResponse } from "../Job/JobTypes";
import { JobDetails } from "@Components/Dashboard/types";
import EarningsDropdown from "./EarningsDropdown";
import ReferralsTable from "./ReferAndEarnTable";
import httpServiceObj from "@Services/ApiHandler.service";
import { useDashboardContext } from "@Context/Dashboard.context";

const stats = [
    { label: 'Total Applicants', value: 106 },
    { label: 'Rejected', value: 90 },
    { label: 'Reviewed', value: 20 },
    { label: 'New Applicants', value: 10 },
    { label: 'Hired', value: 90 },
  ];
  
  const handleRedirect = () => {
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/jobs?dashboard=USER`;
  };

  const ReferAndEarn = () => {
    const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
    const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"PUBLISHED" | "CLOSED" | "ARCHIVED">("PUBLISHED");
    const [searchBarText, setsearchBarText] = useState<string>('');
    const [data, setData] = useState<JobApiResponse | null>(null);
    const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
    const [searchBarTextTemp, setsearchBarTextTemp] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [referrals, setReferrals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
      count: 0,
      pageSize: 25,
      sortOrder: "descending",
      timesQueried: 0,
      queriedCount: 0,
      lastKey: undefined,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [lastKeyMap, setLastKeyMap] = useState<Record<number, string>>({});

      //filter data
    const filteredReferrals = useMemo(() => {
      if (!statusFilter) return referrals;
      return referrals.filter((item) => item.status === statusFilter);
    }, [referrals, statusFilter]);



    const { user } = useDashboardContext();

  const fetchReferrals = async (page = 1, pageSize = 25) => {
    if (!user?.email) {
      setError("User email is not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lastKey = page > 1 ? lastKeyMap[page - 1] : undefined;
      const lastKeyParam = lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : "";
      const encodedEmail = encodeURIComponent(user.email);

      const { response }: { response: any } = await httpServiceObj.get(
        `/refer-and-earn?referrerEmail=${encodedEmail}&pageSize=${pageSize}${lastKeyParam}&searchText=${searchBarText || ""}`,
        true,
        {},
        false,
        "JOB"
      );

      if (!response?.data || !Array.isArray(response.data)) {
        setReferrals([]);
        setPagination(prev => ({ ...prev, count: 0, lastKey: undefined }));
        return;
      }

      const formatted = response.data.map((item: any) => ({
        id: item.id || `temp-${Math.random()}`,
        name: item.recipientDetails?.name || "N/A",
        jobTitle: item.jobDetails?.title || "N/A",
        email: item.recipientDetails?.email || "N/A",
        phone: item.recipientDetails?.phoneNumber || "N/A",
        jobApplicationStatus: item.jobApplicationStatus,
        dateReferred: item.referredDate
          ? new Date(item.referredDate).toLocaleDateString("en-GB")
          : "N/A",
        dateApplied: item.jobApplicationStatus && item.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString("en-GB")
          : "----",
        status: item.status || "PENDING",
        referralBonus: item.commissionAmount || 0,
      }));

      setReferrals(formatted);

      if (response?.pagination?.lastKey) {
        setLastKeyMap(prev => ({ ...prev, [page]: response.pagination.lastKey }));
      }

      setPagination({
        count: response?.pagination?.count || formatted.length,
        pageSize,
        sortOrder: "descending",
        timesQueried: response?.pagination?.timesQueried || 1,
        queriedCount: response?.pagination?.queriedCount || 0,
        lastKey: response?.pagination?.lastKey,
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
      setError("Failed to load referrals. Please try again.");
      setReferrals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals(currentPage, pagination.pageSize);
  }, [user?.email, currentPage, pagination.pageSize, searchBarText]);

  const handlePageChange = (page: number) => setCurrentPage(page);

const handlePageSizeChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
  if (typeof value === "number") {
    setPagination(prev => ({ ...prev, pageSize: value }));
    setCurrentPage(1);
    setLastKeyMap({});
  } else {
    setPagination(prev => {
      const newPageSize = value(prev.pageSize);
      setCurrentPage(1);
      setLastKeyMap({});
      return { ...prev, pageSize: newPageSize };
    });
  }
};



    return (
      <div className="w-full space-y-[35px] px-0">
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between'>
          <div className=" flex-1 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
                >
                  <p className="text-sm text-[#64748B]">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{"-"}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
            <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden">
              <input
                type="text"
                placeholder="Search by name or job"
                value={searchBarTextTemp}
                onChange={(e) => setsearchBarTextTemp(e.target.value)}
                className="px-4 py-3 w-full outline-none bg-[#FAFAFA] text-sm"
              />
              <button
                onClick={()=>setsearchBarText(searchBarTextTemp)}
                className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none">
                Search
              </button>
            </div>
              <div className="relative">
                <select
                  className="h-full px-4 py-3 bg-white text-sm text-gray-700 border-l border-gray-200 outline-none cursor-pointer rounded-xl"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="WITHDRAWAL_ACCEPTED">Withdrawal Accepted</option>
                  <option value="WITHDRAWAL_REJECTED">Withdraw Rejected</option>
                  <option value="PAYMENT_COMPLETED">Payment Completed</option>
                  <option value="NOT_ACHIEVED_YET">Under Process</option>
                  <option value="ACHIEVED">Achieved</option>
                </select>
              </div>
            </div>
          <div className="w-max">
            <button
              onClick={handleRedirect}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-blue-700"
            >
              Refer a friend
            </button>
          </div>
          </div>
          <EarningsDropdown />
        </div>
  
  
        <ReferralsTable
          referrals={filteredReferrals}
          pagination={pagination}
          currentPage={currentPage}
          isLoading={isLoading}
          error={error}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
  
      </div>
    );

}
export default ReferAndEarn;
