import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReferralsTable from "./modals/ReferralsTable";
import { ReferralApiResponse, PaginationInfo, ReferralFilters } from "./modals/ReferralTypes";
import { debounce } from "lodash";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { toast } from "react-toastify";
import VerifyCompanymodal from "./modals/VerifyCompanymodal";

const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 25,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};


interface UserDetails {
  id: string;
  companyId:string;
  // add any other fields you expect
}
// const statsItems = [
//   { label: "Total Referrals", value: 52 },
//   { label: "Accepted", value: 30 },
//   { label: "Pending", value: 15 },
//   { label: "Rejected", value: 7 },
// ];

const Referrals = () => {
  const [searchBarText, setSearchBarText] = useState("");
  const [data, setData] = useState<ReferralApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<ReferralFilters>({});
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const [companyID,setCompanyID] = useState("")
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const paginationKeysRef = useRef<Record<number, string>>({
    1: "",
  });

  const { user, isLoadingUser } = useDashboardContext();

  const APP_API_URI = import.meta.env.APP_API_URI
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI

const fetchReferrals = useCallback(
  async (
    page: number = 1,
    size: number = pageSize,
    lastKey: string = "",
    searchFilters = filters,
    isSearch = false
  ) => {
    if (!user?.email) return;
    console.log(user,isLoadingUser)
    setIsLoading(true);
      const url = `${APP_API_URI}/user/${user.email}/experience`;
        let companyId = "";
        try {
          const { response } = await httpServiceObj.get(url, true, {}, true);
          const data = response as UserDetails[]; 
          if (Array.isArray(data) && data[0]?.id) {
            companyId = data[0].companyId;
            setCompanyID(companyId);
          } else {
            setShowVerifyModal(true);
            console.warn("User details array is empty or invalid.");
            return; 
          }
        } catch (error) {
          console.error("Cannot fetch user details:", error);
        }
    try {  
      // const url = `${APP_API_URI}/user/${user.email}/referral?lastKey=${lastKey}&pageSize=${size}`;
      const url = `/emp/referral/${user.email}?companyId=${companyId}&pageSize=${size}&lastKey=${lastKey}`;
      const { response, error } = await httpServiceObj.get<ReferralApiResponse>(url, true,);
      if (response) {
        setData(response);
        console.log(response)
        if (response.pagination) {
          setPaginationInfo(response.pagination);

          if (isSearch || page === 1) {
            paginationKeysRef.current = { 1: "" };
            if (response.pagination.lastKey) {
              paginationKeysRef.current[2] = response.pagination.lastKey;
            }
          } else if (response.pagination.lastKey) {
            paginationKeysRef.current[page + 1] = response.pagination.lastKey;
          }
        }
      } else if (error) {
        console.error("Error fetching referrals:", error);
      }
    } catch (err) {
      console.error("Exception in fetchReferrals:", err);
    } finally {
      setIsLoading(false);
    }
  },
  [user, pageSize, filters]
);


  // search handlers
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
  };

  const handleSearch = useCallback(() => {
    if (searchInputRef.current) {
      clearTimeout(searchInputRef.current);
    }
    setCurrentPage(1);
    setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
    paginationKeysRef.current = { 1: "" };
    fetchReferrals(1, pageSize, "", { ...filters, searchText: searchBarText }, true);
  }, [fetchReferrals, filters, pageSize, searchBarText]);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  const handlePageChange = useCallback((page: number) => {
      const lastKey = paginationKeysRef.current[page] || "";
      
      setCurrentPage(page);
      fetchReferrals(page, pageSize, lastKey);
    },
    [fetchReferrals, pageSize]
  );


  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchReferrals(1, size, "");
    },
    [fetchReferrals]
  );

  // const handleGetNewReferral = () => {
  //   window.location.href = `${window.location.origin}${import.meta.env.APP_PROXY_BASE}/referrals`;
  // };

  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchReferrals(1, pageSize, "");
    }
  }, [user, fetchReferrals, pageSize]);

  useEffect(() => {
    return () => {
      if (searchInputRef.current) {
        clearTimeout(searchInputRef.current);
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  if (isLoadingUser || !user) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-[35px] px-0">
      {/* stats cards */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between">
        <div className="flex-1 flex flex-col gap-4">
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-start overflow-x-auto">
            {statsItems.map((stat) => (
              <div
                key={stat.label}
                className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
              >
                <p className="text-sm text-[#64748B]">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div> */}
            
          {/* search bar */}
            <div className="flex flex-col gap-4 w-full">
            {/* Search bar with search button */}
            <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden">
                <input
                type="text"
                placeholder="Search referrals"
                value={searchBarText}
                onChange={handleSearchChange}
                className="px-4 py-3 w-full outline-none bg-[#FAFAFA] text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onBlur={() => searchBarText && debouncedSearch()}
                />
                <button
                onClick={handleSearch}
                className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none"
                >
                Search
                </button>
            </div>

            {/* Get New Referral Button */}
            {/* <div className="flex justify-start">
            <button
                onClick={handleGetNewReferral}
                className="bg-[#316BFF] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#2555cc] transition"
            >
                Get New Referral
            </button>
            </div> */}
            </div>

        </div>
        {showVerifyModal && (
          <VerifyCompanymodal
            isOpen={showVerifyModal}
            onClose={() => setShowVerifyModal(false)}
          />
        )}
      </div>

      {isLoading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">Loading referrals...</p>
          </div>
        </div>
      ) : (
        <ReferralsTable
          data={data}
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => {
            const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || "" : "";
            fetchReferrals(currentPage, pageSize, lastKey);
          }}
        />
      )}
    </div>
  );
};

export default Referrals;
