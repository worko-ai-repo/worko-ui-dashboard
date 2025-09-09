import { useState } from "react";
import { Minus, Send } from "lucide-react";
import Modal from "../../../Shared/Modal";
import InviteForm from "../../../Shared/CorporateInvite/SendInviteForm";
import RevokeForm from "../../../Shared/CorporateInvite/RevokeForm";
import { CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { handleInvitePatch } from "@Components/Dashboard/WorkoAdmin/Invite/AdminCorporateUserTable";
import { CorporateUserPageRecDataDto } from "@Interfaces/AdminServices.dto";

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
      render: (row: (typeof data)[0]) => (
        <span className="w-full capitalize">
          {row?.firstName} {row?.lastName}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone no" },
    {
      key: "createdAt",
      label: "Date",
      render: (row: (typeof data)[0]) => formatDateToDDMMYYYY(row.createdAt),
    },
    { key: "access", label: "Access" },
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
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
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
                    await handleInvitePatch(row.corporateUserDetails.id, "DELETE_CORPORATE_USER", fetchInvites);
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
  ];

  return (
    <>
      <DynamicTable<CorporateUserPageRecDataDto>
        columns={columns}
        rows={data ?? []}
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
