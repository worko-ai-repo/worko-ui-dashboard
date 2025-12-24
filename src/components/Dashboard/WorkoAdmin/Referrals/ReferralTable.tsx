import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import Modal from "@Components/Shared/Modal";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";

import {Link, Loader2 } from "lucide-react";
import { useState } from "react";
import ProgressCircle from "@Components/Shared/CircularBar";
import Timeline, { TimelineStep } from "@Components/Shared/Timeline";
import CommonDashboardServicesObj, {
  ExtraReferralDetailsResponse,
} from "@Utils/CommonDashboard.utils";
import { ReferralStatusType } from "src/types/JobsAndApplication.type";
import { ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { View } from "@AssetsFolder/assets";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import ScorePointsModal from "@Components/Shared/DetailedAnalysis";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

interface ReferralTableProps {
  data: ReferralDetailsDto[];
  fetchReferrals: () => void;
  queryKey: any[];
  pagination: CommonCursorPaginationProp;
}

const ReferralTable: React.FC<ReferralTableProps> = ({
  data,
  queryKey,
  pagination,
}) => {
  const queryClient = useQueryClient();
  const keyFallbacks = {
    matchingScore: ["matchingScore"],
    userDetails_name: ["userDetails.name"],
    employeeDetails_name: ["employeeDetails.name"],
    status: ["status"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: "referrals",
    persistInUrl: true,
    persistInLocalStorage: false,
    defaultSort: null,
  });

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [updatingReferralId, setUpdatingReferralId] = useState<string | null>(null);
  const [scorePointsModal, setScorePointsModal] = useState<{
    title: string;
    data: any;
    matchingScore: number;
    candidateName: string;
    details?: boolean;
    showCloseButton?: boolean;
    onClose?: () => void;
  } | null>(null);

  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE";
    user: ReferralDetailsDto | {};
    key?: number;
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
      key: Date.now(),
    });
  };

  const handleViewExtraDetails = async (row: ReferralDetailsDto) => {
    const details = await CommonDashboardServicesObj.fetchExtraReferralDetails(row);
    setOpenExtraDetailsModal({
      isOpen: true,
      details,
      key: row.PK,
    });
  };

  // Mutation for updating referral status (example for future use)
  const updateReferralMutation = useMutation({
    mutationFn: async ({
      referralId,
      updates,
    }: {
      referralId: string;
      updates: Partial<ReferralDetailsDto>;
    }) => {
      // Replace with actual API call
      // return await AdminServiceObj.updateReferral(referralId, updates);
      throw new Error("Update API not implemented");
    },
    onMutate: async ({ referralId, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((referral: ReferralDetailsDto) =>
              referral.PK === referralId ? { ...referral, ...updates } : referral
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to update referral", getToastOptions({}));
    },
    onSuccess: () => {
      toast.success("Referral updated successfully", getToastOptions({}));

      // Invalidate counts to refresh stats
      queryClient.invalidateQueries({ queryKey: ["counts", "referrals"] });
    },
  });

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
            className="flex items-center mx-auto btn-sky cursor-pointer"
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
        <div className="flex justify-center items-center gap-2">
          <ProgressCircle
            onClick={() => {
              setFeedbackModalOpen(true);

              const application = jobApplicationServiceObj.getScoreDetails(row as any);
              if (application === null) return;
              setScorePointsModal({
                title: application.type === "SCORE" ? "Matching Score Details" : "Rejected Reason",
                data: application.feedback,
                matchingScore: row.matchingScore ?? 0,
                candidateName: row.userDetails.name,
                details: true,
                showCloseButton: true,
                onClose: () => setFeedbackModalOpen(false),
              });
            }}
            value={row.matchingScore}
          />
          {updatingReferralId === row.PK && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          )}
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
            <p
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row.emailFeedback}
              className="text-wrap line-clamp-4">
              {row.emailFeedback || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: ReferralDetailsDto) => {
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
          className="btn-sky mx-auto grid grid-cols-[20px_auto] ">
          <img src={View} className="h-4 w-4" />
          View Cv
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
        className="w-[800px]  py-8">
        <CVPreviewRaw
          key={OpenExtraDetailsModal.key}
          pdfUrl={OpenExtraDetailsModal.details?.viewCvLink || ""}
          candidateName={OpenExtraDetailsModal.details?.name || "User"}
          companyName={OpenExtraDetailsModal.details?.companyName || ""}
          YOE={0}
          onClose={() => setIsViewCVModalOpen(false)}
        />
      </Modal>
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        className="py-5">
        {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
      </Modal>
    </>
  );
};

export default ReferralTable;
