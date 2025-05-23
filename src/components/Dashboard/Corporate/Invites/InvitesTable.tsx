import { useState } from "react";
import { Minus, Send } from 'lucide-react';
import Modal from "../Modal";
import InviteForm from "./SendInviteForm";
import RevokeForm from "./RevokeForm";
import { CorporateInviteResponse, CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import { DynamicTable } from "../DynamicTable";

interface InviteTableProps {
    data: CorporateInviteResponse;
    fetchInvites: () => void;
};

function formatDateToDDMMYYYY(isoDate: string): string {
    const date = new Date(isoDate);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getUTCFullYear();

    return `${day}-${month}-${year}`;
}


const InviteTable: React.FC<InviteTableProps> = ({
    data,
    fetchInvites,
}) => {
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
            render: (row: typeof data.data[0]) => (
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
            render: (row: typeof data.data[0]) => formatDateToDDMMYYYY(row.createdAt),
        },
        { key: "access", label: "Access" },
        {
            key: "inviteStatus",
            label: "Invite status",
            render: (row: typeof data.data[0]) => {
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
            render: (row: typeof data.data[0]) => (
                <>
                {row.inviteStatus !== 'DELETED' && <button
                    onClick={() => setIsSendInviteModalOpen(true)}
                    className={`px-3 py-2 rounded-lg text-white bg-blue-500 ${row.inviteStatus === "ACCEPTED" || row.inviteStatus === "DELETED"
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-blue-600"
                    }`}
                    disabled={row.inviteStatus === "ACCEPTED" || row.inviteStatus === "DELETED"}
                    >
                    <Send size={16} />
                </button>}
                    </>

            ),
        },
        {
            key: "revoke",
            label: "Revoke",
            render: (row: typeof data.data[0]) => (
                <>
            {row.inviteStatus !== 'DELETED' && <button
                    onClick={() => {
                        setIsRevokedModalOpen(true);
                        setSelectedInviteId(row.id);
                    }}
                    className="p-1 rounded-full border-2 border-blue-600 hover:bg-gray-100"
                    >
                    <Minus className="text-gray-500 font-bold" size={16} />
                </button>}
                    </>
            ),
        },
    ];

    return (
        <>
            <DynamicTable<CorporateInvite>
                columns={columns}
                rows={data?.data ?? []}
                enableSelect={false}
            />
            <Modal
                isOpen={isSendInviteModalOpen}
                onClose={() => setIsSendInviteModalOpen(false)}
                className="w-[90vw] sm:w-[455px] sm:h-[500px] h-[90vh]"
            >
                <InviteForm />
            </Modal>
            <Modal
                isOpen={isRevokedModalOpen}
                onClose={() => {setIsRevokedModalOpen(false); setSelectedInviteId(null)}}
                className="w-[90vw] sm:w-[455px] sm:h-[277px] h-[90vh]"
            >
                <RevokeForm
                    inviteId={selectedInviteId as string}
                    onClose={() => {setIsRevokedModalOpen(false); setSelectedInviteId(null); fetchInvites();}}
                />
            </Modal>
        </>
    );
};

export default InviteTable;
