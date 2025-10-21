import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  CursorPaginationGuidanceDataAdminParams,
  CursorPaginationReferralsDataAdminParams,
  CursorPaginationUsersDataAdminParams,
  GuidanceRequestDto,
} from "@Interfaces/AdminServices.dto";
import { useEffect, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import { ReferralStatusType } from "src/types/JobsAndApplication.type";
import GuidancePageTable from "./GuidanceTable";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useQueryClient } from "@tanstack/react-query";

const AdminGuidance = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReferralStatusType | "">("");

  // Use URL state management for persistence
  const {
    searchText: searchBarText,
    setSearchText: setSearchBarText,
    pageSize,
    setPageSize,
  } = useUrlState({
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 25,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

  const params: Omit<CursorPaginationGuidanceDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    actionByUserType: "ADMIN",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

  // Stable query key
  const queryKey = ["AdminGuidanceQuery", !!searchBarText, JSON.stringify(params)];

  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<GuidanceRequestDto, CursorPaginationGuidanceDataAdminParams>({
    queryKey: queryKey,
    queryFn: AdminServiceObj.fetchGuidance,
    baseParams: params,
    enabled: !!params,
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [searchBarText, pageSize]);

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col mt-3 ">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              placeholder="Search by company name"
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => refetch()}
            />
          </div>
        </div>
        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <GuidancePageTable
            data={data}
            fetchGuidance={refetch}
            queryKey={queryKey}
            pagination={{
              goToNextPage,
              goToPreviousPage,
              hasNextPage,
              hasPreviousPage,
              pageSize,
              setPageSize,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminGuidance;
