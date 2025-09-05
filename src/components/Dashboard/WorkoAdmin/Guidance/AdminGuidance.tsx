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

const AdminGuidance = () => {
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<ReferralStatusType | "">("");
  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationGuidanceDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    actionByUserType: "ADMIN",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

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
    queryKey: ["AdminGuidanceQuery", !!searchBarText, params],
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
        <div className="flex flex-col ">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
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
