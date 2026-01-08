import { useState } from "react";
import { Minus, Send } from "lucide-react";
import Modal from "../../../Shared/Modal";
import InviteForm from "../../../Shared/CorporateInvite/SendInviteForm";
import RevokeForm from "../../../Shared/CorporateInvite/RevokeForm";
import { CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { handleInvitePatch } from "@Components/Dashboard/WorkoAdmin/Invite/AdminCorporateUserTable";
import { CorporateUserPageRecDataDto } from "@Interfaces/AdminServices.dto";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";

interface InviteTableProps {
  data: CorporateUserPageRecDataDto[];
  fetchInvites: () => void;
  pagination: CommonCursorPaginationProp;
}

function formatDateToDDMMYYYY(isoDate: string): string {
  const date = new Date(isoDate);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

const InviteTable: React.FC<InviteTableProps> = ({ data, fetchInvites, pagination }) => {
  const [isSendInviteModalOpen, setIsSendInviteModalOpen] = useState(false);
  const [isRevokedModalOpen, setIsRevokedModalOpen] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const KeyFallback = {
    name: ["firstName", "lastName"],
  };
  const { sortedData, sortConfig, onSortChange } = useSortableData(data, KeyFallback, {
    defaultSort: null,
    tableId: "invite-table",
    persistInUrl: true,
    persistInLocalStorage: false,
  });
  const status: Record<string, string> = {
    ACCEPTED: "Joined",
    AWAITING: "Sent",
    DELETED: "Revoked",
    EXPIRED: "Expired",
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: (typeof data)[0]) => (
        <span className="w-full capitalize">
          {row?.firstName} {row?.lastName}
        </span>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    {
      key: "phoneNumberDetails",
      label: "Phone Number",
      render: (row: CorporateUserPageRecDataDto) => {
        const phoneNumber = row?.phoneNumberDetails
          ? "+"+ row.phoneNumberDetails.countryCode + " " + row.phoneNumberDetails.phoneNumber
          : "N/A";
        return (
          <span className="w-36 mx-auto cursor-pointer select-all" title="Double click to copy">
            {phoneNumber}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row: (typeof data)[0]) => formatDateToDDMMYYYY(row.createdAt),
    },
    {
      key: "access",
      label: "Access",
      render: (row: CorporateUserPageRecDataDto) => {
        const userType = row?.corporateUserDetails?.corporateUserType || row?.corporateUserType;
        const isAdmin = userType === "corporate-admin";
        return (
          <span
            className={`capitalize mx-auto px-2  py-1 rounded-full text-xs font-medium block max-w-[99.3%] cursor-pointer ${
              isAdmin ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
            data-tooltip-place="top">
            {isAdmin ? "Admin" : "Recruiter"}
          </span>
        );
      },
    },
    {
      key: "inviteStatus",
      label: "Invite status",
      render: (row: (typeof data)[0]) => {
        let color = "";
        switch (row.inviteStatus) {
          case "ACCEPTED":
            color = "bg-green-100 text-green-600";
            break;
          case "AWAITING":
            color = "bg-blue-100 text-blue-600";
            break;
          case "DELETED":
            color = "bg-red-100 text-red-600";
            break;
          default:
            color = "bg-gray-100 text-gray-600";
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {status[row.inviteStatus]}
          </span>
        );
      },
    },
    {
      key: "resend",
      label: "Resend",
      render: (row: (typeof data)[0]) => (
        <>
          {row.inviteStatus !== "DELETED" && (
            <button
              onClick={async () => await handleInvitePatch(row.id, "RESEND", fetchInvites)}
              disabled={
                row.inviteStatus === "ACCEPTED" ||
                row.inviteStatus === "DELETED" ||
                row.inviteStatus === "EXPIRED"
              }
              className={`px-3 py-2 rounded-lg text-white bg-blue-500 btn_disabled`}>
              <Send size={16} />
            </button>
          )}
        </>
      ),
    },
    ...(secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE) ===
    UserRole.CORPORATE_ADMIN
      ? [
          {
            key: "revoke",
            label: "Revoke",
            render: (row: (typeof data)[0]) => (
              <>
                {row.inviteStatus !== "DELETED" && (
                  <button
                    onClick={async () => {
                      if (row.inviteStatus === "ACCEPTED") {
                        if (row?.corporateUserDetails?.id) {
                          await handleInvitePatch(
                            row.corporateUserDetails.id,
                            "DELETE_CORPORATE_USER",
                            fetchInvites
                          );
                        }
                      } else {
                        setIsRevokedModalOpen(true);
                        setSelectedInviteId(row.id);
                      }
                    }}
                    className="p-1 rounded-full border-2 border-red-500 hover:bg-gray-100">
                    <Minus className="text-red-500 font-bold" size={16} />
                  </button>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <NewDynamicTable<CorporateUserPageRecDataDto>
        columns={columns}
        rows={sortedData ?? []}
        onSortChange={onSortChange}
        enableSelect={false}
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        handlePreviousPage={pagination.goToPreviousPage}
        handleNextPage={pagination.goToNextPage}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPreviousPage}
      />
      <Modal
        isOpen={isSendInviteModalOpen}
        onClose={() => setIsSendInviteModalOpen(false)}
        className="w-min">
        <InviteForm
          compId={data?.[0]?.companyId ?? ""}
          onClose={() => {
            fetchInvites();
            setIsSendInviteModalOpen(false);
          }}
          onRefetch={fetchInvites}
        />
      </Modal>
      <Modal
        isOpen={isRevokedModalOpen}
        onClose={() => {
          setIsRevokedModalOpen(false);
          setSelectedInviteId(null);
        }}
        className="h-52">
        <RevokeForm
          inviteId={selectedInviteId as string}
          onClose={() => {
            setIsRevokedModalOpen(false);
            setSelectedInviteId(null);
            fetchInvites();
          }}
        />
      </Modal>
    </>
  );
};

export default InviteTable;
