import { Column, NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import Modal from "@Components/Shared/Modal";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";

import { Eye, Link } from "lucide-react";
import { useState } from "react";
import ProgressCircle from "@Components/Shared/CircularBar";
import Timeline, { TimelineStep } from "@Components/Shared/Timeline";
import CommonDashboardServicesObj, {
  ExtraReferralDetailsResponse,
} from "@Utils/CommonDashboard.utils";
import { ReferralStatusType } from "src/types/JobsAndApplication.type";
import { ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { View } from "@AssetsFolder/assets";
import ViewExtraReferralDetailsModal from "@Components/Modals/SharedModals/ViewExtraReferrakDetailsModal";

interface ReferralTableProps {
  data: ReferralDetailsDto[];
  fetchReferrals: () => void;
  pagination: CommonCursorPaginationProp;
}
const ReferralTable: React.FC<ReferralTableProps> = ({ data, fetchReferrals, pagination }) => {
  const keyFallbacks = {};

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: "referral-table",
    persistInUrl: true,
    persistInLocalStorage: true,
  });
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE";
    user: ReferralDetailsDto | {};
    key?: number; // Add a unique key to force re-render
  }>({ isOpen: false, type: "EMAIL", user: {} });
  const [OpenExtraDetailsModal, setOpenExtraDetailsModal] = useState<{
    isOpen: boolean;
    details: ExtraReferralDetailsResponse | null;
    key?: string;
  }>({ isOpen: false, details: null, key: undefined });
  const handleVerifyClick = (type: "EMAIL" | "MOBILE", user: ReferralDetailsDto) => {
    setVerifyModalOpen({
      isOpen: true,
      type,
      user,
      key: Date.now(), // Add a unique timestamp
    });
  };

  const handleViewExtraDetails = async (row: ReferralDetailsDto) => {
    const details = await CommonDashboardServicesObj.fetchExtraReferralDetails(row);
    setOpenExtraDetailsModal({
      isOpen: true,
      details,
      key: row.PK, // Use row ID as key to force re-render when different row is clicked
    });
  };

  const columns = [
    { key: "employeeDetails_name", label: "Employee Name", sortable: true },
    {
      key: "jobUrl",
      label: "Job Url",
      render: (row: ReferralDetailsDto) => (
        <a
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Open Job Link in new tab"
        >
          <Link
            size={34}
            onClick={(e) => {
              e.stopPropagation();
              window.open(row?.jobUrl, "_blank");
            }}
            className="flex items-center btn-sky cursor-pointer"
          />
        </a>
      ),
    },
    { key: "userDetails_name", label: "Candidate Name", sortable: true },
    {
      key: "matchingScore",
      label: "Matching Score",
      sortable: true,
      render: (row: ReferralDetailsDto) => (
        <div className="flex justify-center">
          <ProgressCircle
            key={"progress-" + row.PK}
            onClick={() => {
              handleViewExtraDetails(row);
            }}
            value={row.matchingScore}
          />
        </div>
      ),
    },
    {
      key: "emailFeedback",
      label: "Employee Feedback",
      sortable: false,

      render: (row: ReferralDetailsDto) => (
        <div className="flex justify-center">
          <div className="text-center w-[800px] ">
            <p className="text-wrap line-clamp-4">{row.emailFeedback}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: ReferralDetailsDto) => {
        // Status color mapping
        const statusColors = CommonDashboardServicesObj.getReferralStatusColor;
        const statusAliases = CommonDashboardServicesObj.getReferralStatusAlias;
        const colorClass =
          statusColors[row.status as ReferralStatusType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex justify-center relative">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
              {statusAliases[row.status as ReferralStatusType]}
            </span>
          </div>
        );
      },
    },
    {
      key: "action",
      label: "Actions",
      render: (row: ReferralDetailsDto) => (
        <button
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View Candidate CV"
          onClick={async () => {
            handleViewExtraDetails(row);
          }}
          className="btn-sky grid grid-cols-[20px_auto] ">
          <img src={View} className="h-4 w-4" />
          View more
        </button>
      ),
    },
  ];
  const renderExpandedDetails = (row: ReferralDetailsDto) => {
    const timeLineProps: TimelineStep[] = CommonDashboardServicesObj.getReferralTimeline(row);
    return timeLineProps ? (
      <div className="p-4 flex justify-evenly gap-4">
        <Timeline steps={timeLineProps} />
      </div>
    ) : (
      <span className="text-gray-500">No additional details available.</span>
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
      <NewDynamicTable<ReferralDetailsDto>
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
        isOpen={OpenExtraDetailsModal.isOpen}
        onClose={() => {
          OpenExtraDetailsModal.isOpen &&
            setOpenExtraDetailsModal({ isOpen: false, details: null, key: undefined });
        }}
        className="w-[90vw] sm:max-w-4xl h-screen py-8">
        <ViewExtraReferralDetailsModal
          key={OpenExtraDetailsModal.key}
          details={OpenExtraDetailsModal.details}
          onClose={() => setIsViewCVModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default ReferralTable;
