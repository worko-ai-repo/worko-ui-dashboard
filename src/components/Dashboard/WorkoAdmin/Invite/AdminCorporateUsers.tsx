import { useEffect, useState } from "react";

import SkeletonLoader from "../../../Shared/SkeletonLoader";
import { useAppContext } from "@Context/App.context";
import {
  CursorPaginationCorporateUserAdminDataParams,
  CursorPaginationCorporateUserRecDataParams,
  CursorPaginationInviteDataParams,
} from "@Interfaces/CorporateServices.dto";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  CorporateUserPageAdminDataDto,
  CorporateUserPageRecDataDto,
} from "@Interfaces/AdminServices.dto";
import AdminServiceObj from "../Services/Admin.service";
import SearchBar from "@Components/Shared/SearchBar";
import AdminCorporateUserTable from "./AdminCorporateUserTable";
import Modal from "@Components/Shared/Modal";
import InviteForm from "@Components/Shared/CorporateInvite/SendInviteForm";

const AdminCorporateInvites = () => {
  const [isSendInviteModalOpen, setIsSendInviteModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(25);

  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationCorporateUserRecDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    includeCompanyDetails: true,
    includeRegisteredCorporateDetails: true,
    corporateUserType: "corporate-admin",
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
  } = useCursorPagination<CorporateUserPageRecDataDto, CursorPaginationCorporateUserRecDataParams>({
    queryKey: ["CorporateUsersQuery", params],
    queryFn: AdminServiceObj.fetchCorporateUsersRec,
    baseParams: params,
  });
  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
    refetch(); // Refetch data when active tab changes
  }, [searchBarText, pageSize]); // Add IsCompanyRequestListing here

  return (
    <div className="space-y-1">
      <div className="flex flex-col ">
        <div className="flex flex-col my-3 sm:flex-row justify-between items-center gap-1">
          {/* Search Bar */}
          <SearchBar
            placeholder="Search by email"
            searchBarText={searchBarText}
            setSearchBarText={setSearchBarText}
            handleClick={() => refetch()}
          />
          <div className="flex">
            <button
              onClick={() => setIsSendInviteModalOpen(true)}
              className="bg-gradient-to-b text-nowrap from-[#80E7E7] to-[#316BFF] text-white px-5 py-2 rounded-xl font-medium w-full">
              + Send Invite
            </button>
          </div>
        </div>
      </div>
      {queryIsJobsLoading && (!data || data.length === 0) ? (
        <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
      ) : (
        <AdminCorporateUserTable // Switch the order to match the state
          data={data as CorporateUserPageRecDataDto[]}
          fetchCorporateUsers={refetch}
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

      <Modal
        isOpen={isSendInviteModalOpen}
        onClose={() => setIsSendInviteModalOpen(false)}
        className="w-min">
        <InviteForm
          onRefetch={refetch}
          compId={"ADMIN"} // Pass the company ID here
          onClose={() => {
            refetch(); // Fixed: Actually call the refetch function
            setIsSendInviteModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminCorporateInvites;
