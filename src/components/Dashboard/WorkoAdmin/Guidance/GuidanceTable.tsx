import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";

import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";

import { Edit } from "lucide-react";
import { useReducer, useState } from "react";
import CommonDashboardServicesObj, {
  ExtraReferralDetailsResponse,
} from "@Utils/CommonDashboard.utils";

import { View } from "@AssetsFolder/assets";
import ViewExtraReferralDetailsModal from "@Components/Modals/SharedModals/ViewExtraReferrakDetailsModal";
import { GuidanceRequestDto } from "@Interfaces/AdminServices.dto";
import GuidanceModal from "./GuidanceModal";
import GuidanceUpdateModal from "./GuidanceUpdateModal";

interface GuidancePageTableProps {
  data: GuidanceRequestDto[];
  fetchGuidance: () => void;
  pagination: CommonCursorPaginationProp;
}

// 1. Define modal types
type ModalType = "viewGuidance" | "updateStatus" | null;

// 2. Define state shape
interface ModalState {
  activeModal: ModalType;
  key?: string;
  data?: GuidanceRequestDto | null;
  fetchGuidance?: () => void;
  viewUpdateMode?: "REJECT" | "RESCHEDULE";
}

// 3. Actions for reducer
type Action = { type: "OPEN"; modal: ModalType; payload?: Partial<ModalState> } | { type: "CLOSE" };

// 4. Reducer
function modalReducer(state: ModalState, action: Action): ModalState {
  switch (action.type) {
    case "OPEN":
      return { activeModal: action.modal, ...action.payload };
    case "CLOSE":
      return { activeModal: null, key: undefined, data: null, fetchGuidance: undefined };
    default:
      return state;
  }
}

const GuidancePageTable: React.FC<GuidancePageTableProps> = ({
  data,
  fetchGuidance,
  pagination,
}) => {
  const keyFallbacks = {
    userDetails_name: ["name", "userDetails.name"],
    userDetails_about: ["about", "userDetails.about"],
  };

  const [modalState, dispatch] = useReducer(modalReducer, {
    activeModal: null,
    key: undefined,
    data: null,
    fetchGuidance: undefined,
    viewUpdateMode: undefined,
  });

  const { sortedData, onSortChange } = useSortableData(data,keyFallbacks);

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [OpenExtraDetailsModal, setOpenExtraDetailsModal] = useState<{
    isOpen: boolean;
    details: ExtraReferralDetailsResponse | null;
    key?: string;
  }>({ isOpen: false, details: null, key: undefined });

  const columns:Column<GuidanceRequestDto>[] = [
    { key: "userDetails_name", label: "Candidate Name", sortable: true },
    {
      key: "userDetails_about",
      label: "About Candidate",
      sortable: true,
      render: (row: GuidanceRequestDto) => (
        <div className="flex justify-center">
          <div className="text-center w-[800px] ">
            <p
            data-tooltip-id="my-tooltip"
            data-tooltip-content={row.userDetails?.about} 
            className="text-wrap line-clamp-4">{row.userDetails?.about}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      contentWidth: "max-w-none w-32",
      render: (row: GuidanceRequestDto) => {
        const status = row.status as keyof typeof CommonDashboardServicesObj.getGuidanceStatusAlias;
        return (
          <span
            className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${CommonDashboardServicesObj.getGuidanceStatusColor[status]}`}>
            {CommonDashboardServicesObj.getGuidanceStatusAlias[status]}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date & time",
      sortable: true,
      render: (row: GuidanceRequestDto) => <span>{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: "action",
      label: "Actions",
      contentWidth: "max-w-none w-96",
      render: (row: GuidanceRequestDto) => (
        <div className="flex justify-center w-full  flex-col sm:flex-row gap-2">
          <button
            onClick={() =>
              dispatch({
                type: "OPEN",
                modal: "updateStatus",
                payload: { data: row, key: row.id, fetchGuidance },
              })
            }
            className="btn-sky grid grid-cols-[20px_auto] ">
            <Edit className="h-4 w-4" />
            Update Status
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "OPEN",
                modal: "viewGuidance",
                payload: { data: row, key: row.id, fetchGuidance },
              })
            }
            className="btn-sky grid grid-cols-[20px_auto] ">
            <img src={View} className="h-4 w-4 " />
            View Details
          </button>
        </div>
      ),
    },
  ];
  const renderExpandedDetails = (row: GuidanceRequestDto) => {
    return (
      <div className="flex items-center gap-4 p-4">
        <a
          href={row?.jobUrl}
          className="flex text-blue-500 font-semibold cursor-pointer  flex-col items-center ">
          <label className="font-semibold text-gray-500">Job Url</label>
          Link
        </a>
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">Requirement Details</label>
          <p className="whitespace-pre-wrap">{row.guidanceRequestDescription}</p>
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
      <DynamicTable<GuidanceRequestDto>
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
      {/* View Guidance Modal */}
      <Modal
        isOpen={modalState.activeModal === "viewGuidance"}
        onClose={() => dispatch({ type: "CLOSE" })}
        className="text-left py-4 pb-0">
        <GuidanceModal
          data={modalState.data!}
          onClose={() => dispatch({ type: "CLOSE" })}
          onStatusChanged={(status) => {
            // Add the status parameter
            dispatch({
              type: "CLOSE",
            });
            dispatch({
              type: "OPEN",
              modal: "updateStatus",
              payload: {
                ...modalState,
                activeModal: "updateStatus",
                viewUpdateMode: status, // Use the actual status passed from GuidanceModal
              },
            });
          }}
        />
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={modalState.activeModal === "updateStatus"}
        onClose={() => dispatch({ type: "CLOSE" })}
        className="text-left py-4 pb-0 w-[400px]">
        <GuidanceUpdateModal
          data={modalState.data!}
          onClose={() => dispatch({ type: "CLOSE" })}
          overrideType={modalState?.viewUpdateMode}
          fetchGuidance={modalState.fetchGuidance!}
        />
      </Modal>
    </>
  );
};

export default GuidancePageTable;
