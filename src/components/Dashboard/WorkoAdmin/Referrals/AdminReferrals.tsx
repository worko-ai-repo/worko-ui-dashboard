import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  CursorPaginationReferralsDataAdminParams,
  CursorPaginationUsersDataAdminParams,
} from "@Interfaces/AdminServices.dto";
import { ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import { ReferralStatusType } from "src/types/JobsAndApplication.type";
import ReferralTable from "./ReferralTable";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useQueryClient } from "@tanstack/react-query";

const AdminReferrals = () => {
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

  const params: Omit<CursorPaginationReferralsDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    ...(status ? { status: status } : {}),
  };

  // Stable query key
  const queryKey = ["AdminReferralQuery", !!searchBarText, JSON.stringify(params)];

  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<ReferralDetailsDto, CursorPaginationReferralsDataAdminParams>({
    queryKey: queryKey,
    queryFn: AdminServiceObj.fetchReferrals,
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
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails key={`referrals`} pageType="referrals" />
          </div>
        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <ReferralTable
            data={data}
            fetchReferrals={refetch}
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

export default AdminReferrals;
