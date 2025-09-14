import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { useState, useEffect, useReducer } from "react";
import Table from "@Components/Dashboard/Candidate/SharedComponents/Table";
import WithdrawDialog from "./WithdrawDialog";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { ReferAndEarnDto } from "@Interfaces/AdminServices.dto";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { ReferAndEarnStatusType } from "src/types/JobsAndApplication.type";
import {
  ReferAndEarnJobStatusOptionsArray,
  ReferAndEarnStatusOptionsLabel,
} from "@TypesAndConstants/common.constants";
import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import { Check, Edit, RefreshCcw, X } from "lucide-react";
import Modal from "@Components/Shared/Modal";
import ReferNearnProcessPayment from "./ReferNearnProcessPayment";
import ReferNearnRejectReferral from "./ReferNearnRejectReferral";
import ReferAndEarnReferralStatusUpdateModal from "./ReferAndEarnReferralStatusUpdateModal";
import AdminServiceObj from "../Services/Admin.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

interface ReferAndEarnTableProps {
  data: ReferAndEarnDto[];
  fetchRefernEarn: () => void;
  pagination: CommonCursorPaginationProp;
}
type ModalType = "processPayment" | "reject" | "updateStatus" | null;
type modalState = {
  activeModal: ModalType;
  key?: string;
  data?: ReferAndEarnDto | null;
  fetchRefernEarn?: () => void;
};

// 3. Actions for reducer
type despatchAction =
  | {
      type: "OPEN";
      modal: ModalType;
      payload?: Partial<modalState>;
    }
  | { type: "CLOSE" };

const modalReducer = (state: modalState, action: despatchAction): modalState => {
  switch (action.type) {
    case "OPEN":
      return { activeModal: action.modal, ...action.payload };
    case "CLOSE":
      return { activeModal: null, key: undefined, data: null, fetchRefernEarn: undefined };
    default:
      return state;
  }
};


  /**
   * Handle handleAcceptWithdrawal
   */
  const handleAcceptWithdrawal = async (id:string,callbackFn:()=>void) => {
    try {

      const response = await AdminServiceObj.patchReferAndEarnStatus(id, {
        status: "WITHDRAWAL_ACCEPTED",
      });
      if (!response) {
        throw new Error("No response from server");
      }
      toast.success("Withdrawal request accepted successfully!", getToastOptions());
    } catch (error) {
      console.error("Error making request:", error);
      toast.error("Failed to update referral. Please try again.", getToastOptions());
    } finally {
      callbackFn();
    }
  };



const AdminReferAndEarnTable: React.FC<ReferAndEarnTableProps> = ({
  data,
  fetchRefernEarn,
  pagination,
}) => {
  const { user } = useDashboardContext();
  const keyFallbacks = {
    referrerDetails_name: ["name", "referrerDetails.name"],
    referrerDetails_email: ["email", "referrerDetails.email"],
    jobDetails_title: ["title", "jobDetails.title"],
  };
  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [modalState, dispatch] = useReducer(modalReducer, {
    activeModal: null,
    key: undefined,
    data: null,
    fetchRefernEarn: undefined,
  });

  const getBonusColor = (status: ReferAndEarnStatusType) =>
    status === "PAYMENT_COMPLETED"
      ? "text-green-600"
      : ["WITHDRAWAL_REJECTED", "CANCELLED", "CLOSED"].includes(status)
      ? "text-red-600"
      : status === "ACHIEVED"
      ? "text-blue-600"
      : "text-yellow-600";

  // Define columns for the table
  const columns:Column<ReferAndEarnDto>[] = [

    {
      key: "referrerDetails_name",
      label: "Referred by",
      sortable: true,
      // className: "capitalize font-semibold text-sm text-nowrap",
    },
    {
      key: "recipientDetails_name",
      label: "Referral name",
      sortable: true,
    },
    {
      key: "referrerDetails_phoneNumber",
      // className: "text-sm",
      label: "Phone",
      render: (row: ReferAndEarnDto) => (
        <span>
          {row.referrerDetails?.phoneCountryCode ? `+${row.referrerDetails.phoneCountryCode} ` : ""}
          {row.referrerDetails?.phoneNumber || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      // className: "text-sm",
      label: "Date referred",
      sortable: true,
      render: (row: ReferAndEarnDto) =>
        new Date(row.referredDate).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "jobAppliedDate",
      // className: "text-sm",
      label: "Date applied",
      sortable: true,
      render: (row: ReferAndEarnDto) =>
        row?.jobAppliedDate
          ? new Date(row.jobAppliedDate).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
    {
      key: "jobDetails_title",
      label: "Job title",
      sortable: true,
      // className: "capitalize text-sm",
    },

    {
      key: "jobApplicationStatus",
      // className: "text-xs",
      label: "Referral Status",
      sortable: true,
      render: (row: ReferAndEarnDto) => {
        return (
          <div
            className={`px-8 py-2 rounded-full border truncate border-gray-300 ${
              ReferAndEarnJobStatusOptionsArray[row.jobApplicationStatus].style
            }`}>
            <span className="text-xs">
              {ReferAndEarnJobStatusOptionsArray[row.jobApplicationStatus].label}
            </span>
          </div>
        );
      },
    },
    {
      key: "referralBonus",
      // className: "text-sm",
      label: "Referral bonus",
      sortable: true,
      render: (row: ReferAndEarnDto) => (
        <div className={`flex mx-auto   items-center gap-1 ${getBonusColor(row.status)}`}>
          <span className="font-semibold text-center w-full">Rs. {row.commissionAmount || 0}</span>
        </div>
      ),
    },
    {
      key: "status",
      // className: "text-xs",
      label: "Withdrawal Status",
      sortable: true,
      render: (row: ReferAndEarnDto) => {
        return (
          <div
            className={`px-8 py-2 rounded-full border truncate border-gray-300 ${
              ReferAndEarnStatusOptionsLabel[row.status].style
            }`}>
            <span className="text-xs">{ReferAndEarnStatusOptionsLabel[row.status].label}</span>
          </div>
        );
      },
    },
    {
      key: "Actions",
      label: "Actions",
      contentWidth: "max-w-none",
      render: (row: ReferAndEarnDto) => {
        // 3 Buttons: Reject Referrals, Process Payment, Update Status
        const rejectBtnNotVisible = !["WITHDRAWAL_REQUESTED"].includes(row.status);
        return (
          <div className="flex gap-2 justify-center">
           {!rejectBtnNotVisible && (
            <>
              <button
                 disabled={rejectBtnNotVisible}
                className="btn-reject flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-lg btn_disabled"
                onClick={async () =>
                  await handleAcceptWithdrawal(row.id,fetchRefernEarn)
                }>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </button>
              <button
                 disabled={rejectBtnNotVisible}
                className="btn-reject flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-lg btn_disabled"
                onClick={() =>
                  dispatch({
                    type: "OPEN",
                    modal: "reject",
                    payload: { data: row, fetchRefernEarn },
                  })
                }>
                <X className="mr-2 h-4 w-4" />
                Reject
              </button>
            </>
           )}
            {row.status === "WITHDRAWAL_ACCEPTED" && <button
               disabled={row.status !== "WITHDRAWAL_ACCEPTED"}
              className="btn-sky flex items-center justify-center text-white px-4 py-2 rounded-lg btn_disabled"
              onClick={() =>
                dispatch({
                  type: "OPEN",
                  modal: "processPayment",
                  payload: { data: row, fetchRefernEarn },
                })
              }>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Process Payment
            </button>}
            <button
              className="btn-sky flex items-center justify-center text-white px-4 py-2 rounded-lg"
              onClick={() =>
                dispatch({
                  type: "OPEN",
                  modal: "updateStatus",
                  payload: { data: row, fetchRefernEarn },
                })
              }>
              <Edit className="mr-2 h-4 w-4" />
              Update Status
            </button>
          </div>
        );
      },
    },
  ];

  const renderExpandedDetails = (row: ReferAndEarnDto) => {
    return (
      <div className="p-4  flex justify-start gap-12">

        <span>
          <label>Id</label>
          <p className="capitalize">{row.id}</p>
        </span>
        <span>
          <label>Referral name</label>
          <p className="capitalize">{row?.referrerDetails?.email}</p>
        </span>

        <span>
          <label>Referral email id</label>
          <p>{row.recipientDetails.email}</p>
        </span>

        <span>
          <label>Referral number</label>
          <p>
            +{row.recipientDetails.phoneCountryCode} {row.recipientDetails.phoneNumber}
          </p>
        </span>
      </div>
    );
  };
  /**
   * Toggle row expansion
   */
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };
  return (
    <>
      <DynamicTable<ReferAndEarnDto>
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
        isOpen={modalState.activeModal === "processPayment"}
        onClose={() => {
          dispatch({ type: "CLOSE" });
        }}
        className=" sm:max-w-4xl h-full">
        {modalState.data && (
          <ReferNearnProcessPayment
            data={modalState.data}
            refetch={modalState.fetchRefernEarn!}
            onClose={() => dispatch({ type: "CLOSE" })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalState.activeModal === "reject"}
        onClose={() => {
          dispatch({ type: "CLOSE" });
        }}
        className=" sm:max-w-lg h-full">
        {modalState.data && (
          <ReferNearnRejectReferral
            data={modalState.data}
            refetch={modalState.fetchRefernEarn!}
            onClose={() => dispatch({ type: "CLOSE" })}
          />
        )}
      </Modal>
      <Modal
        isOpen={modalState.activeModal === "updateStatus"}
        onClose={() => {
          dispatch({ type: "CLOSE" });
        }}
        className=" sm:max-w-lg h-full">
        {modalState.data && (
          <ReferAndEarnReferralStatusUpdateModal
            data={modalState.data}
            refetch={modalState.fetchRefernEarn!}
            onClose={() => dispatch({ type: "CLOSE" })}
          />
        )}
      </Modal>
    </>
  );
};
export default AdminReferAndEarnTable;
