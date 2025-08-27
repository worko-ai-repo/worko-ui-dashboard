import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useAppContext } from "@Context/App.context";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationReferralsDataAdminParams, CursorPaginationUsersDataAdminParams } from "@Interfaces/AdminServices.dto";
import { ApplicantDetails, ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import EmployeeTable from "../Employee/EmployeeTable";
import ReferralsTable from "@Components/Dashboard/Candidate/Pages/ReferAndEarn/ReferAndEarnTable";


const AdminReferrals = () => {
  const [pageSize, setPageSize] = useState(25);

  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationReferralsDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
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
  } = useCursorPagination<ReferralDetailsDto, CursorPaginationReferralsDataAdminParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!searchBarText, params],
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

  if (queryIsJobsLoading) {
    return (
      <SkeletonLoader
        showButtons={true}
        buttonCount={1}
        showTableHeader={true}
        showTableRows={true}
        tableColumns={5}
        rowCount={5}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => console.log("Search clicked")}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
              {/*  <BulkStatusDropDown
                options={[
                  { label: "Accept", onClick: () => onBulkUpdate("CV_DOWNLOADED") },
                  {
                    label: "Send to evaluator",
                    onClick: () => {
                      handleBulkEvaluatorUpdate();
                    },
                  },
                  { label: "Initiate Interview", onClick: () => onBulkUpdate("PROCESSING_INTERVIEW") },
                  { label: "Hired", onClick: () => onBulkUpdate("HIRED") },
                  { label: "Joined", onClick: () => onBulkUpdate("JOINED") },
                  { label: "On Hold", onClick: () => onBulkUpdate("ON_HOLD") },
                  { label: "Reject", onClick: () => onBulkUpdate("REJECTED") },
                ]}
                apiStatus={apiStatus} // Change this to test
                disabled={apiStatus === undefined || apiStatus === "ON_HOLD" || apiStatus === "REJECTED"}
                tooltipMessage="Select a bulk status update"
                selectTitle="Bulk"
              /> */}
            </div>
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
          <ReferralsTable
            data={data}
            fetchReferrals={refetch}
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
