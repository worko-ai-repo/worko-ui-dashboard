import { DynamicTable } from "@Components/Shared/DynamicTable";

import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CorporateUserPageRecDataDto } from "@Interfaces/AdminServices.dto";
import {
  CommonCursorPaginationProp,
  CursorPaginationCorporateUserRecDataParams,
} from "@Interfaces/CorporateServices.dto";

import { Building2, Edit, Minus, Send, Trash, Trash2 } from "lucide-react";
import { useReducer, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import CorporateUsersSubTable from "./AdminCorporateSubTable";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import Modal from "@Components/Shared/Modal";
import RevokeForm from "@Components/Shared/CorporateInvite/RevokeForm";
import CompanyLogoRender from "../Company/CompanyLogoRender";

interface AdminCorporateUserTableProps {
  data: CorporateUserPageRecDataDto[];
  fetchCorporateUsers: () => void;
  pagination: CommonCursorPaginationProp;
}

// 1. Define modal types
type ModalType = "revoke" | "add" | null;

// 2. Define state shape
interface ModalState {
  activeModal: ModalType;
  key?: string;
  data?: CorporateUserPageRecDataDto | null;
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

  const { sortedData, onSortChange } = useSortableData(data, {
    companyDetails_name: ["companyDetails.name"],
  });
  const [subDataCompanyId, setSubDataCompanyId] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const params: Omit<CursorPaginationCorporateUserRecDataParams, "lastKey"> = {
    pageSize: 200,
    sortOrder: "descending",
    companyId: subDataCompanyId,
    includeCompanyDetails: false,
    includeRegisteredCorporateDetails: true,
  };

  const handleDeleteUser = async (userId: string) => {
    await handleInvitePatch(userId, "DELETE_CORPORATE_USER", fetchCorporateUsers);
  };

  const handleResendInvite = (inviteId: string) => {
    handleInvitePatch(inviteId, "RESEND", fetchCorporateUsers);
  };

  const handleGrantDuplicacyAccess = (inviteId: string) => {
    handleInvitePatch(inviteId, "GRANT_DUPLICACY_ACCESS", fetchCorporateUsers);
  };

  const handleRevokeInvite = (row: CorporateUserPageRecDataDto, inviteId: string) => {
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

  const handleRevokeInviteForSubTable = (inviteId: string) => {
    const row = subData?.find((item) => item.id === inviteId);
    if (row) {
      handleRevokeInvite(row, inviteId);
    }
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
    queryKey: ["CorporateSubUsersQuery", !!subDataCompanyId, params],
    queryFn: AdminServiceObj.fetchCorporateUsersRec,
    baseParams: params,
    enabled: !!subDataCompanyId, // only run if companyId exists
  });

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (row: CorporateUserPageRecDataDto) => (
        <span
          className="lowercase text-xs cursor-pointer select-all"
          onDoubleClick={(e) => {
            const text = row?.corporateUserDetails?.id ?? row?.id ?? "No ID available";
            navigator.clipboard.writeText(text);
          }}
          title="Double click to copy">
          {row?.corporateUserDetails?.id ?? row?.id ?? "No ID available"}
        </span>
      ),
    },
    {
      key: "companyDetails_name",
      label: "Company Name",
      sortable: true,
      render: (row: CorporateUserPageRecDataDto) => (
        <span className="capitalize flex gap-2 items-center justify-center text-center truncate max-w-[99.3%] cursor-pointer text-sm">
          {row?.companyDetails && row.companyDetails.id ? (
            <CompanyLogoRender {...row.companyDetails} key={row.id} />
          ) : null}
          {row?.companyDetails?.name || "No company available"}
        </span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (row: CorporateUserPageRecDataDto) => {
        const firstName = row?.corporateUserDetails?.firstName || row?.firstName;
        const lastName = row?.corporateUserDetails?.lastName || row?.lastName;
        return (
          <span
            className="capitalize text-center truncate block max-w-[99.3%] cursor-pointer text-sm"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={`${firstName} ${lastName}`}
            data-tooltip-place="top">
            {firstName} {lastName}
          </span>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: CorporateUserPageRecDataDto) => (
        <span
          className="w-48 mx-auto lowercase cursor-pointer select-all"
          onDoubleClick={(e) => {
            const text = row?.corporateUserDetails?.email || row?.email || "No email available";
            navigator.clipboard.writeText(text);
          }}
          title="Double click to copy">
          {row?.corporateUserDetails?.email || row?.email || "No email available"}
        </span>
      ),
    },
    {
      key: "phoneNumberDetails",
      label: "Phone Number",
      render: (row: CorporateUserPageRecDataDto) => {
        const phoneNumber = row?.phoneNumberDetails
          ? row.phoneNumberDetails.countryCode + row.phoneNumberDetails.phoneNumber
          : "N/A";
        return (
          <span
            className="w-36 mx-auto cursor-pointer select-all"
            title="Double click to copy">
            {phoneNumber}
          </span>
        );
      },
    },
    {
      key: "accessType",
      label: "Access Type",
      render: (row: CorporateUserPageRecDataDto) => {
        const userType = row?.corporateUserDetails?.corporateUserType || row?.corporateUserType;
        const isAdmin = userType === "corporate-admin";
        return (
          <span
            className={`capitalize w-fit mx-auto px-2  py-1 rounded-full text-xs font-medium truncate block max-w-[99.3%] cursor-pointer ${
              isAdmin ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
            data-tooltip-place="top">
            {isAdmin ? "Admin" : "Recruiter"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (subRow: CorporateUserPageRecDataDto) => {
        const status = subRow?.inviteStatus;
        const getStatusStyle = (status: string) => {
          switch (status) {
            case "ACCEPTED":
              return "bg-green-100 text-green-800";
            case "AWAITING":
              return "bg-yellow-100 text-yellow-800";
            case "EXPIRED":
              return "bg-gray-100 text-gray-800";
            case "DELETED":
              return "bg-red-100 text-red-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        };
        return (
          <div className="w-full flex justify-start  ">
            <span
              className={`capitalize mx-auto   px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                status
              )}`}>
              {status || "Active"}
            </span>
          </div>
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      render: (subRow: CorporateUserPageRecDataDto) => {
        const hasUserDetails = !!subRow?.corporateUserDetails;
        const isDeleted = subRow?.corporateUserDetails?.isDeleted;
        const isAccepted = subRow?.inviteStatus === "ACCEPTED";
        const CantRevoke =
          isAccepted ||
          isDeleted ||
          hasUserDetails ||
          subRow?.inviteStatus === "EXPIRED" ||
          subRow?.inviteStatus === "DELETED";
        return (
          <div className="flex flex-col sm:flex-row gap-1 justify-center">
            {/* Delete button - only show for registered users (has corporateUserDetails) */}
            {hasUserDetails && handleDeleteUser && (
              <button
                onClick={() =>
                  subRow?.corporateUserDetails?.id &&
                  handleDeleteUser(subRow?.corporateUserDetails?.id)
                }
                disabled={isDeleted}
                className=" btn_disabled px-2 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete User">
                <Trash size={14} />
              </button>
            )}

            {/* Resend invite button - only for pending invites */}
            {!hasUserDetails && !isAccepted && handleResendInvite && (
              <button
                disabled={CantRevoke}
                onClick={() => handleResendInvite(subRow?.id)}
                className="btn_disabled px-2 py-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600"
                title="Resend Invite">
                <Send size={14} />
              </button>
            )}

            {/* Revoke invite button - only for non-deleted invites */}
            {!hasUserDetails && handleRevokeInviteForSubTable && (
              <button
                disabled={CantRevoke}
                onClick={() => handleRevokeInviteForSubTable(subRow?.id)}
                className="btn_disabled p-1 rounded-full border-2 border-red-600 hover:bg-red-50"
                title="Revoke Invite">
                <Minus className="text-red-500 font-bold" size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];
  // Update renderExpandedDetails function
  const renderExpandedDetails = () => {
    return (
      <>
        <CorporateUsersSubTable
          data={subData || []}
          isLoading={queryIsJobsLoading}
          onDeleteUser={handleDeleteUser}
          onResendInvite={handleResendInvite}
          onRevokeInvite={handleRevokeInviteForSubTable}
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
        if (company?.companyId) {
          setSubDataCompanyId(company.companyId);
          refetch(); // Explicitly trigger the API call
        }
        return [id];
      }
    });
  };

  return (
    <>
      <DynamicTable<CorporateUserPageRecDataDto>
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
