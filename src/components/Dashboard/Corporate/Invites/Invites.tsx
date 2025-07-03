import { Send } from "lucide-react";
import InviteTable from "./InvitesTable";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import InviteForm from "./SendInviteForm";
import {  CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import SkeletonLoader from "../SkeletonLoader";
import { useAppContext } from "@Context/App.context";
import { CursorPaginationInviteDataParams } from "src/types/corporateServices.types";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import CorporateServiceObj from "../Services/Corporate.service";

const Invites = () => {
  const { userDetails } = useAppContext();

  const [isSendInviteModalOpen, setIsSendInviteModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
 
  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationInviteDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    companyId: userDetails.companyId ?? "", // Now guaranteed to be string
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
  } = useCursorPagination<CorporateInvite, CursorPaginationInviteDataParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!userDetails.companyId, !!searchBarText, params],
    queryFn: CorporateServiceObj.fetchInvites,
    baseParams: params,
    enabled: !!userDetails.companyId, // only run if companyId exists
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [searchBarText, pageSize]);

  if (queryIsJobsLoading) {
    return <SkeletonLoader showButtons={true} buttonCount={1} showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setIsSendInviteModalOpen(true)} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-white text-sm">
          <Send size={16} />
          <span>Invite Team</span>
        </button>
      </div>
      <InviteTable data={data} fetchInvites={refetch} pagination={{goToNextPage,goToPreviousPage,hasNextPage,hasPreviousPage,pageSize,setPageSize}} />
      <Modal isOpen={isSendInviteModalOpen} onClose={() => setIsSendInviteModalOpen(false)} className="w-[90vw] sm:w-[455px] sm:h-[500px] h-[90vh]">
        <InviteForm />
      </Modal>
    </div>
  );
};

export default Invites;
