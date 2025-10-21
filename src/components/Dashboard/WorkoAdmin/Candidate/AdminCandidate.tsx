import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationUsersDataAdminParams } from "@Interfaces/AdminServices.dto";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import CandidateTable from "./CandidateTable";
import InputFromDataToDateFilter from "@Components/Shared/ui/InputFromDataToDateFilter";

const AdminCandidate = () => {
  const [pageSize, setPageSize] = useState(25);

  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const [fromDateToDate, setFromDateToDate] = useState<{
    fromDate: string;
    toDate: string;
  }>({
    fromDate: "",
    toDate: "",
  });

  const params: Omit<CursorPaginationUsersDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    userType: "CAND",
    ...(fromDateToDate && fromDateToDate.fromDate ? { fromDate: fromDateToDate.fromDate } : {}),
    ...(fromDateToDate && fromDateToDate.toDate ? { toDate: fromDateToDate.toDate } : {}),
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
  } = useCursorPagination<ApplicantDetails, CursorPaginationUsersDataAdminParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!searchBarText, params, fromDateToDate],
    queryFn: AdminServiceObj.fetchAdminUsers,
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
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails
            key="admin-candidate-stats"
            pageType="candidates"
            />
          </div>

          <div className="flex flex-col sm:flex-row  justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              placeholder="Search by email."
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => refetch()}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
              <InputFromDataToDateFilter onDateChange={setFromDateToDate} />
            </div>
          </div>
        </div>
        <div className="sticky top-60 ">
          {queryIsJobsLoading ? (
            <SkeletonLoader
              showTableHeader={true}
              showTableRows={true}
              tableColumns={5}
              rowCount={5}
            />
          ) : (
            <CandidateTable
              data={data}
              fetchEmployees={refetch}
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
    </div>
  );
};

export default AdminCandidate;
