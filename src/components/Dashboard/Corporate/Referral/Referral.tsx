import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationReferralsDataAdminParams } from "@Interfaces/AdminServices.dto";
import { ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState } from "react";

import { ReferralStatusType } from "src/types/JobsAndApplication.type";
import ReferralTable from "./ReferralTable";
import CorporateServiceObj from "../Services/Corporate.service";
import { useAppContext } from "@Context/App.context";

const CorporateReferrals = () => {
  const { userDetails } = useAppContext();
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<ReferralStatusType | "">("");
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const companyId = userDetails?.companyId || "";
  const params: Omit<CursorPaginationReferralsDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(companyId && { companyId: companyId }),
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    ...(status ? { status: status } : {}),
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
    queryKey: ["CorpReferralQuery", !!searchBarText, params],
    queryFn: CorporateServiceObj.fetchReferrals,
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
            <HeaderDetails key={`header-details-${companyId}`} pageType="referrals" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => refetch()}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end"></div>
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
          <ReferralTable
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

export default CorporateReferrals;
