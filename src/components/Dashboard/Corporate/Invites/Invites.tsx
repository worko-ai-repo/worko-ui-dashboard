import { Send } from "lucide-react";
import InviteTable from "./InvitesTable";
import { useEffect, useState } from "react";
import Modal from "../../../Shared/Modal";
import InviteForm from "../../../Shared/CorporateInvite/SendInviteForm";
import { CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import SkeletonLoader from "../../../Shared/SkeletonLoader";
import { useAppContext } from "@Context/App.context";
import { CursorPaginationInviteDataParams } from "@Interfaces/CorporateServices.dto";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import CorporateServiceObj from "../Services/Corporate.service";
import { CorporateUserPageRecDataDto } from "@Interfaces/AdminServices.dto";
import secureStorage from "@Utils/SecureStorage.utils";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";

const Invites = () => {
  const { userDetails } = useAppContext();

  const [isSendInviteModalOpen, setIsSendInviteModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);
  
  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationInviteDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    companyId: userDetails?.companyId ?? "", // Now guaranteed to be string
    // Add search text if it exists and is not emp
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
  } = useCursorPagination<CorporateUserPageRecDataDto, CursorPaginationInviteDataParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!userDetails?.companyId, !!searchBarText, params],
    queryFn: CorporateServiceObj.fetchInvites,
    baseParams: params,
    enabled: !!userDetails?.companyId, // only run if companyId exists
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

  const remainingLicenses = 12; // mock for now
  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-end gap-3">
        <div className="flex items-center gap-2 bg-blue-200 border border-blue-400 px-4 py-2 rounded-xl text-sm">
        <span className="text-blue-700 font-medium">
          Remaining Licenses
        </span>
        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold">
          {remainingLicenses}
        </span>
      </div>
        <button
          onClick={() => setIsSendInviteModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-white text-sm">
          <Send size={16} />
          <span>Invite Team</span>
        </button>
      </div>
      <InviteTable
        data={data}
        fetchInvites={refetch}
        pagination={{
          goToNextPage,
          goToPreviousPage,
          hasNextPage,
          hasPreviousPage,
          pageSize,
          setPageSize,
        }}
      />
      <Modal
        isOpen={isSendInviteModalOpen}
        onClose={() => setIsSendInviteModalOpen(false)}
        className="max-w-2xl w-full">
        <InviteForm
          compId={userDetails?.companyId ?? ""} // Now guaranteed to be string
          onClose={() => {
            refetch();
            setIsSendInviteModalOpen(false);
          }}
          onRefetch={refetch}
        />
      </Modal>
    </div>
  );
};

export default Invites;
