import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReferralsTable from "./modals/ReferralsTable";
// import { ReferralApiResponse, PaginationInfo, ReferralFilters } from "./modals/ReferralTypes";
import { ReferralApiResponse, PaginationInfo, ReferralFilters, ReferralDetailsDto } from "./modals/ReferralTypes";
import { debounce } from "lodash";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { ChevronDown } from "lucide-react";
import GenericDropdown from "@Components/Shared/DropDown/GenericDropdown";

const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 25,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};

const statsItems = [
  { label: "Total Referrals", value: 52 },
  { label: "Accepted", value: 30 },
  { label: "Pending", value: 15 },
  { label: "Rejected", value: 7 },
];

const Referrals = () => {
  const [searchBarText, setSearchBarText] = useState("");
  const [data, setData] = useState<ReferralApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<ReferralFilters>({});
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const StatusFilterDropdown = [
  { label: "All", onClick: () => { setStatusFilter("")}},
  { label: "Accepted", onClick: () => { setStatusFilter("ACCEPTED")}},
  { label: "Awaiting", onClick: () => { setStatusFilter("AWAITING")} },
  { label: "Cancelled", onClick: () => { setStatusFilter("CANCELLED")} },
  { label: "Withdrawn", onClick: () => { setStatusFilter("WITHDRAWN")}},
  { label: "Done", onClick: () => { setStatusFilter("DONE")}},
  { label: "Rejected", onClick: () => { setStatusFilter("REJECTED")}},
];

  const paginationKeysRef = useRef<Record<number, string>>({
    1: "",
  });

  const { user, isLoadingUser } = useDashboardContext();

  const APP_API_URI = import.meta.env.APP_API_URI

const fetchReferrals = useCallback(
  async (
    page: number = 1,
    size: number = pageSize,
    lastKey: string = "",
    searchFilters = filters,
    isSearch = false
  ) => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const url = `${APP_API_URI}/user/${user.email}/referral?lastKey=${lastKey}&pageSize=${size}&searchText=${searchBarText || ""}`;
      const { response, error } = await httpServiceObj.get<ReferralApiResponse>(url, true, {}, true);

      if (response) {
        setData(response);
        // console.log(response)
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
  [user, pageSize, filters, APP_API_URI]
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

  const handleGetNewReferral = () => {
    window.location.href = `${window.location.origin}${"/"}referrals`;
  };

  const handleLocalUpdate = useCallback((referralId: string, updatedData: Partial<ReferralDetailsDto>) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        data: prevData.data.map(referral => 
          referral.id === referralId 
            ? { ...referral, ...updatedData }
            : referral
        )
      };
    });
  }, []);

  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchReferrals(1, pageSize, "");
    }
  }, [user, fetchReferrals, pageSize]);

  const filteredData = useMemo(() => {
  if (!data) return null;
  if (!statusFilter) return data;

  return {
    ...data,
    data: data.data.filter(item => item.status === statusFilter)
  };
}, [data, statusFilter]);


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
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between'>
        <div className="flex-1 flex flex-col gap-4">
          <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-start overflow-x-auto">
            {statsItems.map((stat) => (
              <div
                key={stat.label}
                className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
              >
                <p className="text-sm text-[#64748B]">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{"-"}</p>
              </div>
            ))}
          </div>
            
          {/* search bar */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
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
            <div className="relative">
              <div className="relative flex items-center space-x-4">
                {/* <div className="relative w-[140px]"> 
                  <select
                    className="h-full w-full pl-4 pr-10 py-3 bg-white text-sm text-gray-700 border border-gray-300 rounded-xl appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="AWAITING">Awaiting</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                    <option value="DONE">Done</option>
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div> */}
              <div className="flex font-semibold sm:w-auto">
                <GenericDropdown
                  selectTitle={"Status"}
                  tooltipMessage="Select Status to filter applications"
                  disabled={false}
                  options={StatusFilterDropdown}
                />
              </div>

                {/* "Get New Referral" Button, visible only on mobile (hidden on laptop and higher) */}
              <button
                onClick={handleGetNewReferral}
                className="bg-[#316BFF] text-white text-sm font-medium px-5 py-3 rounded-2xl hover:bg-[#2555cc] transition block md:hidden w-[150px] overflow-hidden text-ellipsis whitespace-nowrap hover:w-auto hover:overflow-visible"
              >
                Get New Referral
              </button>

              </div>
            </div>
            </div>
            {/* Get New Referral Button */}
              <div className="flex justify-start">
                <button
                  onClick={handleGetNewReferral}
                  className="bg-[#316BFF] text-white text-sm font-medium px-5 py-3 rounded-lg hover:bg-[#2555cc] transition hidden md:block"
                >
                Get New Referral
            </button>
            </div>
        </div>
                {/* <div className="flex flex-col gap-4 justify-center sm:items-end">
          <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
          </div>
        </div> */}
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
          data={filteredData}
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => {
            const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || "" : "";
            fetchReferrals(currentPage, pageSize, lastKey);
          }}
          onLocalUpdate={handleLocalUpdate}
        />
      )}
    </div>
  );
};

export default Referrals;
