import { DynamicTable } from "@Components/Shared/DynamicTable";

import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import {
  CorporateUserPageAdminDataDto,
  CorporateUserPageRecDataDto,
} from "@Interfaces/AdminServices.dto";
import {
  CommonCursorPaginationProp,
  CursorPaginationCorporateUserRecDataParams,
} from "@Interfaces/CorporateServices.dto";

import { Building2, Edit, Trash, Trash2 } from "lucide-react";
import { useReducer, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import CorporateUsersSubTable from "./AdminCorporateSubTable";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import Modal from "@Components/Shared/Modal";
import RevokeForm from "@Components/Shared/CorporateInvite/RevokeForm";

interface AdminCorporateUserTableProps {
  data: CorporateUserPageAdminDataDto[];
  fetchCorporateUsers: () => void;
  pagination: CommonCursorPaginationProp;
}

// 1. Define modal types
type ModalType = "revoke" | "add" | null;

// 2. Define state shape
interface ModalState {
  activeModal: ModalType;
  key?: string;
  data?: CorporateUserPageAdminDataDto | null;
  fetchCorporateUsers?: () => void;
}

// 3. Actions for reducer
type despatchAction =
  | {
      type: "OPEN";
      modal: ModalType;
      payload?: Partial<ModalState>;
    }
  | { type: "CLOSE" };

// 4. Reducer
function modalReducer(state: ModalState, despatchAction: despatchAction): ModalState {
  switch (despatchAction.type) {
    case "OPEN":
      return { activeModal: despatchAction.modal, ...despatchAction.payload };
    case "CLOSE":
      return { activeModal: null, key: undefined, data: null, fetchCorporateUsers: undefined };
    default:
      return state;
  }
}

export const handleInvitePatch = async (
  id: string,
  action: "RESEND" | "GRANT_DUPLICACY_ACCESS" | "DELETE_CORPORATE_USER",
  onSuccessCallback: () => void
) => {
  try {
    if (action === "RESEND") {
      const data = await AdminServiceObj.updateCorporateUserInviteStatus(id, {
        inviteStatus: "AWAITING",
      });
      if (!data) {
        throw new Error("Failed to resend invite");
      }
      // Show success message or toast
      toast.success("Invite resent successfully", getToastOptions({}));
    } else if (action === "GRANT_DUPLICACY_ACCESS") {
      const data = await AdminServiceObj.updateCorporateUserInviteStatus(id, {
        cvDuplicacyAccess: true,
      });
      if (!data) {
        throw new Error("Failed to grant duplicacy access");
      }
      // Show success message or toast
      toast.success("Duplicacy access granted successfully", getToastOptions({}));
    } else if (action === "DELETE_CORPORATE_USER") {
      const data = await AdminServiceObj.deleteCorporateUser(id);
      if (!data) {
        throw new Error("Failed to delete corporate user");
      }
      // Show success message or toast
      toast.success("Corporate user deleted successfully", getToastOptions({}));
    }
  } catch (error) {
    // Handle error, show error message or toast
    toast.error("Something went wrong. Please try again.", getToastOptions({}));
  } finally {
    return onSuccessCallback();
  }
};

const AdminCorporateUserTable: React.FC<AdminCorporateUserTableProps> = ({
  data,
  fetchCorporateUsers,
  pagination,
}) => {
  // Modal state is the state in modalReducer and dispatch is the action dispatcher
  const [modalState, dispatch] = useReducer(modalReducer, {
    activeModal: null,
    key: undefined,
    data: null,
    fetchCorporateUsers: undefined,
  });

  const { sortedData, onSortChange } = useSortableData(data, {});
  const [subDataCompanyId, setSubDataCompanyId] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const params: Omit<CursorPaginationCorporateUserRecDataParams, "lastKey"> = {
    pageSize: 200,
    sortOrder: "descending",
    companyId: subDataCompanyId,
    includeCompanyDetails: true,
    includeRegisteredCorporateDetails: true,
  };

  const {
    data: subData,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<CorporateUserPageRecDataDto, CursorPaginationCorporateUserRecDataParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!subDataCompanyId, params],
    queryFn: AdminServiceObj.fetchCorporateUsersRec,
    baseParams: params,
    enabled: !!subDataCompanyId, // only run if companyId exists
  });

  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (row: CorporateUserPageAdminDataDto) => (
        <InteractiveInput
          data={row?.id}
          isLoading={false}
          variant="copy"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "companyDetails_name",
      label: "Company Name",
      sortable: true,
      render: (row: CorporateUserPageAdminDataDto) => {
        const [imgError, setImgError] = useState(false);
        const finalLogoUrl = row?.companyDetails?.logo
          ? `${import.meta.env.APP_WORKO_BASE_URL}/images/${row?.companyDetails?.logo}`
          : row?.companyDetails?.logoUrl;
        return finalLogoUrl && !imgError ? (
          <div className="flex items-center gap-2 mx-auto justify-start w-64">
            <img
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row?.companyDetails?.name}
              src={finalLogoUrl}
              alt={row?.companyDetails?.name}
              loading="lazy"
              className="h-12 w-12 cursor-pointer border object-contain rounded-full  "
              onError={() => setImgError(true)} // This only affects the current component
            />
            <span>{row.companyDetails?.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2  mx-auto justify-start w-64">
            <Building2
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row?.companyDetails?.name}
              className="h-12 w-12 cursor-pointer border p-2 rounded-full text-gray-400"
            />
            <span>{row.companyDetails?.name}</span>
          </div>
        );
      },
    },
    {
      key: "firstName",
      label: "Name",
      sortable: true,
      render: (row: CorporateUserPageAdminDataDto) => (
        <span
          className=" capitalize truncate block max-w-[99.3%] cursor-pointer"
          data-tooltip-id="my-tooltip"
          data-tooltip-content={row?.firstName + " " + row?.lastName}
          data-tooltip-place="top">
          {row?.firstName} {row?.lastName}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: CorporateUserPageAdminDataDto) => (
        <InteractiveInput
          data={row?.email}
          isLoading={false}
          variant="copy"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "AccessType",
      label: "Access Type",
      sortable: true,
      render: (row: CorporateUserPageAdminDataDto) => (
        <span
          className=" capitalize bg-red-500 w-fit mx-auto px-3 rounded-full p-1 text-white  truncate block max-w-[99.3%] cursor-pointer"
          data-tooltip-place="top">
          Admin
        </span>
      ),
    },

    {
      key: "action",
      label: "Actions",
      render: (row: CorporateUserPageAdminDataDto) => (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleInvitePatch(row.id, "DELETE_CORPORATE_USER", fetchCorporateUsers)}
            disabled={row.isDeleted}
            className={`px-3 py-2 mx-auto rounded-lg text-white bg-red-500 btn_disabled`}>
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Update renderExpandedDetails function
  const renderExpandedDetails = (row: CorporateUserPageAdminDataDto) => {
    const handleDeleteUser = async (userId: string) => {
       await handleInvitePatch(userId, "DELETE_CORPORATE_USER", fetchCorporateUsers);
     
    };

    const handleResendInvite = (inviteId: string) => {
      handleInvitePatch(inviteId, "RESEND", fetchCorporateUsers);
    };

    const handleGrantDuplicacyAccess = (inviteId: string) => {
      handleInvitePatch(inviteId, "GRANT_DUPLICACY_ACCESS", fetchCorporateUsers);
    };

    const handleRevokeInvite = (inviteId: string) => {
      dispatch({
        type: "OPEN",
        modal: "revoke",
        payload: {
          key: inviteId,
          data: row,
          fetchCorporateUsers: fetchCorporateUsers,
        },
      });
    };

    return (
      <>
        {/* Reusable Sub Table */}
        <CorporateUsersSubTable
          data={subData || []}
          isLoading={queryIsJobsLoading}
          onDeleteUser={handleDeleteUser}
          onResendInvite={handleResendInvite}
          onRevokeInvite={handleRevokeInvite}
          showActions={true}
          className="mt-4"
        />
      </>
    );
  };

  /**
   * Toggle row expansion
   */
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      if (prev.includes(id)) {
        // Collapse the row if it's already expanded
        setSubDataCompanyId("");
        return [];
      } else {
        // Expand the new row and collapse others
        const company = data.find((d) => d.id === id);
        if (company?.companyDetails?.id) {
          setSubDataCompanyId(company?.companyDetails?.id);
          refetch(); // Explicitly trigger the API call
        }
        return [id];
      }
    });
  };

  return (
    <>
      <DynamicTable<CorporateUserPageAdminDataDto>
        columns={columns}
        rows={sortedData ?? []}
        enableSelect={false}
        onSortChange={onSortChange}
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        handlePreviousPage={pagination.goToPreviousPage}
        handleNextPage={pagination.goToNextPage}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPreviousPage}
        renderExpandedDetails={renderExpandedDetails}
        expandedRows={expandedRows}
        toggleExpand={toggleExpand}
      />

      <Modal
        isOpen={modalState.activeModal === "revoke"}
        onClose={() => dispatch({ type: "CLOSE" })}
        className="h-52">
        <RevokeForm
          inviteId={modalState.key as string}
          onClose={() => dispatch({ type: "CLOSE" })}
        />
      </Modal>
    </>
  );
};

export default AdminCorporateUserTable;
