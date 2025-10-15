import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  CursorPaginationReferAndEarnAdminParams,
  ReferAndEarnDto,
} from "@Interfaces/AdminServices.dto";
import { useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import HeaderDetails from "@Components/Shared/Stats";
import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import EarningsCard from "./EarningsDropdown";
import AdminReferAndEarnTable from "./ReferAndEarnTable";

const AdminReferAndEarn = () => {
  const [pageSize, setPageSize] = useState(25);

  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationReferAndEarnAdminParams, "lastKey"> = {
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
  } = useCursorPagination<ReferAndEarnDto, CursorPaginationReferAndEarnAdminParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!searchBarText, params],
    queryFn: AdminServiceObj.fetchReferAndEarnDetails,
    baseParams: params,
    enabled: !!params,
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex gap-3">
          <div className="flex flex-1  flex-col ">
            <div className="flex flex-wrap  gap-4">
            <HeaderDetails
            key={`header-details-refer-and-earn` }
            pageType="referr&earn"
            />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Search Bar */}
              <SearchBar
                placeholder="Search by company name, job title, ph.no, recipient detail."
                searchBarText={searchBarText}
                setSearchBarText={setSearchBarText}
                handleClick={() => refetch()}
              />
            </div>
          </div>
          <EarningsCard />
        </div>
        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <AdminReferAndEarnTable
            data={data}
            fetchRefernEarn={refetch}
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
export default AdminReferAndEarn;
