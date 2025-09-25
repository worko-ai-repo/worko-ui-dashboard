import React, { useState } from "react";
import { Eye, NotebookIcon, Send, User } from "lucide-react";

// Component imports
import CVPreview from "@Components/Shared/ApplicantsPage/CVPreview";
import RejectionForm from "@Components/Shared/ApplicantsPage/RejectForm";
import EvaluatorForm, { EvaluatorFormProps } from "@Components/Shared/ApplicantsPage/EvaluatorForm";
import HireNowForm from "@Components/Shared/ApplicantsPage/HireNowForm";
import ProgressCircle from "../../../Shared/CircularBar";
import RequestDocumentModal, {
  RequestDocModalProps,
} from "@Components/Shared/ApplicantsPage/RequestDocModal";
import Modal from "../../../Shared/Modal";
import { DynamicTable } from "../../../Shared/DynamicTable";
import NotesApp from "@Components/Shared/ApplicantsPage/Notes";

// Assets and interfaces
import { Not_Responding } from "@Assets";
import { JobApplicationDetailsDto, StatusTracker } from "@Interfaces/CorporateDashboard.dto";
import { ApplicationListSelectionDto, JobApplicationUpdatePayloadDto } from "./Applicants";
import ScorePointsModal, { ScorePointsModalProps } from "@Components/Shared/DetailedAnalysis";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import {
  newDisplayStatus,
  statusColors,
} from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { JobApplicationActions } from "@Components/Shared/ApplicantsPage/ApplicationActions";
import ResendOfferLetter, {
  getLatestOfferLetterIssueRaisedDetails,
  handleViewDocumentClick,
} from "@Components/Shared/ApplicantsPage/ReSendOfferLetter";
import ResponseEvaluation from "@Components/Shared/ApplicantsPage/ViewEvaluation";
import Duplicacy from "@Components/Shared/ApplicantsPage/Duplicacy";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import { JoinedModal } from "@Components/Shared/ApplicantsPage/JoinedModal";
import Timeline, { TimelineStep } from "@Components/Shared/Timeline";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";

// Component props interface
interface ApplicationTableProps {
  activeTab: "All" | "Hired" | "Joined";
  setActiveTab: (tab: "All" | "Hired" | "Joined") => void;
  ListSelection: ApplicationListSelectionDto;
  data: JobApplicationDetailsDto[];
  handleUpdate: (
    payload: JobApplicationUpdatePayloadDto,
    jobId: string,
    hasRefetch: boolean
  ) => void;
  userType: string;
  refetch: () => void;
  Pagination: CommonCursorPaginationProp;
  isAddEvaluatorModalOpen: boolean;
  setIsAddEvaluatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  EvaluatorFormProps: EvaluatorFormProps | null;
  setEvaluatorFormProps: React.Dispatch<React.SetStateAction<EvaluatorFormProps | null>>;
  // Add these new props to match improved functionality
  sendApplicationToRecruiter?: (applicationId: string) => void;
  showRejectReason?: (application: JobApplicationDetailsDto) => void;
  viewDuplicacyDetails?: (portal: string, date: string) => void;
  isBulkEvaluation: boolean; // New prop to handle bulk evaluation

  onBulkUpdate: (JobApplicationStatusType: JobApplicationStatusType) => void; // Optional prop for bulk update functionality
}

export const getCvViewDate = (statusTracker: StatusTracker[]) => {
  const cvDownloadedEntry = statusTracker?.find((entry) => entry.newStatus === "CV_DOWNLOADED");
  return cvDownloadedEntry
    ? new Date(cvDownloadedEntry.actionDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "-";
};
export const getCvDownloadedById = (row: JobApplicationDetailsDto) => {
  const cvDownloadedEntry = row.statusTracker?.find((entry) => entry.newStatus === "CV_DOWNLOADED");
  // ULID length is 26 characters and include - in the middle
  const isUserIdTypeULID =
    cvDownloadedEntry?.userId?.length === 26 || cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID
    ? { updatedByUserId: cvDownloadedEntry?.userId || "" }
    : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
};

export default function ApplicationTable({
  activeTab,
  setActiveTab,
  ListSelection,
  data,
  handleUpdate,
  userType,
  Pagination,
  isAddEvaluatorModalOpen,
  setIsAddEvaluatorModalOpen,
  EvaluatorFormProps,
  setEvaluatorFormProps,
  sendApplicationToRecruiter,
  showRejectReason,
  viewDuplicacyDetails,
  isBulkEvaluation,
  refetch,
  onBulkUpdate,
}: ApplicationTableProps) {
  // State management for expanded rows and modals
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<{
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  } | null>(null);
  const [isViewEvaluator, setViewEvaluation] = useState({
    isOpen: false,
    jobApplicationData: {} as JobApplicationDetailsDto,
  });
  const [isHireNowModalOpen, setIsHireNowModalOpen] = useState<{
    isOpen: boolean;
    jobData: JobApplicationDetailsDto;
  }>({
    isOpen: false,
    jobData: {} as JobApplicationDetailsDto,
  });
  const [isViewOfferIssue, setIsViewOfferIssue] = useState<{
    isOpen: boolean;
    jobData: JobApplicationDetailsDto;
  }>({
    isOpen: false,
    jobData: {} as JobApplicationDetailsDto,
  });
  const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState<RequestDocModalProps>({
    isOpen: false,
    jobApplication: {} as JobApplicationDetailsDto,
    mode: "VIEW",
    onClose: () => setIsRequestDocModalOpen({ ...isRequestDocModalOpen, isOpen: false }),
  });
  const [FeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [evaluatorFormCount, setEvaluatorFormCount] = useState(10);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState({
    isOpen: false,
    jobApplication: null as JobApplicationDetailsDto | null,
  });
  const [scorePointsModal, setScorePointsModal] = useState<ScorePointsModalProps>();
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({
    isOpen: false,
    applicant: {} as JobApplicationDetailsDto,
    action: "EDIT" as "EDIT" | "VIEW",
  });
  const [joinedModalOpen, setJoinedModalOpen] = useState({
    isOpen: false,
    jobApplication: {} as JobApplicationDetailsDto,
  });
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  // Add dropdown state for status updates (improved functionality)
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");

  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    matchingScore: [
      "matchingScore",
      "scoreDetails.matchingScore",
      "scoreDetails.matchingScorePercentage",
    ],
    experience: ["applicantDetails.YOE", "yoe"],
    location: ["applicantDetails.location"],

    applicantDetails_candidateExperience_designation: [
      "applicantDetails.candidateExperience.designation",
    ],
    applicantDetails_CTC: ["applicantDetails.CTC"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);

  // Helper functions (improved functionality)
  const shouldShowUpdateIcon = (row: JobApplicationDetailsDto) => {
    return row.status !== "REJECTED" && row.status !== "HIRED";
  };

  const toggleDropdown = (rowIndex: string) => {
    setDropdownVisibleRows((prev) =>
      prev.includes(rowIndex) ? prev.filter((id) => id !== rowIndex) : [...prev, rowIndex]
    );
  };

  const isDropdownVisible = (rowIndex: string) => {
    return dropdownVisibleRows.includes(rowIndex);
  };

  // Status array for dropdown
  const statusArray = [
    "APPLIED",
    "CV_DOWNLOADED",
    "UNDER_EVALUATION",
    "PROCESSING_INTERVIEW",
    "INTERVIEW_DONE",
    "HIRED",
    "REJECTED",
  ];

  const isOptionDisabled = (option: string, currentStatus: string) => {
    const statusOrder = {
      APPLIED: 0,
      CV_DOWNLOADED: 1,
      UNDER_EVALUATION: 2,
      PROCESSING_INTERVIEW: 3,
      INTERVIEW_DONE: 4,
      HIRED: 5,
      REJECTED: 6,
    };

    return (
      option !== "REJECTED" &&
      statusOrder[option as keyof typeof statusOrder] <=
        statusOrder[currentStatus as keyof typeof statusOrder]
    );
  };

  const transformStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      APPLIED: "Applied",
      CV_DOWNLOADED: "CV Downloaded",
      UNDER_EVALUATION: "Under Evaluation",
      PROCESSING_INTERVIEW: "Processing Interview",
      INTERVIEW_DONE: "Interview Done",
      HIRED: "Hired",
      REJECTED: "Rejected",
      ON_HOLD: "On Hold",
    };
    return statusMap[status] || status;
  };

  // Handle Status update for all buttons
  const handleStatusUpdate = (
    status: JobApplicationStatusType,
    row: JobApplicationDetailsDto,
    hasRefetch: boolean = true
  ) => {
    const payload: JobApplicationUpdatePayloadDto = {
      applicantName: row.applicantDetails.name,
      emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
      status,
      userId: userDetails ? userDetails?.id : "",
      userType,
    };
    handleUpdate(payload, row.id, hasRefetch);
  };

  // Common column definitions
  const commonColumns = {
    name: {
      key: "name",
      label: "Applicants name",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <User size={20} />
          <span>{row.applicantDetails.name}</span>
        </div>
      ),
    },
    experience: {
      key: "experience",
      label: "Experience",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>
            {row.applicantDetails.YOE
              ? row.applicantDetails.YOE === 1
                ? `${row.applicantDetails.YOE} year`
                : `${row.applicantDetails.YOE} years`
              : "0 years"}
          </span>
        </div>
      ),
    },
    yoe: {
      key: "yoe",
      label: "YOE",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails.YOE ?? 0}</span>
        </div>
      ),
    },
    location: {
      key: "location",
      label: "Location",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails?.location ?? "Not Disclosed"}</span>
        </div>
      ),
    },
    matchingScore: {
      key: "matchingScore",
      label: "Matching Score",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex justify-center">
          <ProgressCircle
            onClick={() => {
              setFeedbackModalOpen(true);
              const application = jobApplicationServiceObj.getScoreDetails(row);
              if (application === null) return;
              setScorePointsModal({
                title: application.type === "SCORE" ? "Matching Score Details" : "Rejected Reason",
                data: application.feedback, // Assuming matchingScore is an object with details
                matchingScore: row.matchingScore ?? 0,
                details: true,
                candidateName: row.applicantDetails.name,
                showCloseButton: true,
                onClose: () => setFeedbackModalOpen(false),
              });
              // console.log("Matching Score Details:", scorePointsModal);
            }}
            value={row.matchingScore}
          />
        </div>
      ),
    },
    scoreDetails: {
      key: "scoreDetails",
      label: "Score Details",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex justify-center">
          {row.scoreDetails ? (
            <button
              className="text-blue-600 hover:text-blue-800 text-sm btn_t1"
              onClick={() => {
                setFeedbackModalOpen(true);
                setScorePointsModal({
                  title: "Detailed Analysis",
                  data: row.scoreDetails,
                  matchingScore: row.matchingScore ?? 0,
                  details: true,
                  showCloseButton: true,
                  onClose: () => setFeedbackModalOpen(false),
                });
              }}>
              View Detailed Analysis
            </button>
          ) : (
            <span>-</span>
          )}
        </div>
      ),
    },

    status: {
      key: "status",
      label: "Status",
      sortable: true,
      contentWidth: `mx-auto max-w-none !min-w-auto`,
      render: (row: JobApplicationDetailsDto) => {
        // Status color mapping

        const colorClass =
          statusColors[row.status as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex justify-center mx-auto p-2 w-fit relative">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
              {newDisplayStatus[row.status as JobApplicationStatusType]}
            </span>
          </div>
        );
      },
    },
    IsWorko: {
      key: "IsWorko",
      label: "Job Source",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          {!row?.jobCreatedByCorporateUserId && row?.jobCreatedByUserId ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
              Worko
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
              External
            </span>
          )}
        </div>
      ),
    },
    applicationDate: {
      key: "applicationDate",
      label: "Application Date",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center">
          <span>
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      ),
    },
    cvViewedDate: {
      key: "cvViewedDate",
      label: "CV Viewed Date",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center">
          <span>{getCvViewDate(row.statusTracker)}</span>
        </div>
      ),
    },
    duplicateCV: {
      key: "duplicateCV",
      label: "Duplicate CV",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex justify-center">
          {row.hiredFromOtherPortal?.portal && row.hiredFromOtherPortal?.date ? (
            <button
              className="text-blue-600 hover:text-blue-800 text-sm underline"
              onClick={() =>
                row.hiredFromOtherPortal &&
                viewDuplicacyDetails &&
                viewDuplicacyDetails(row.hiredFromOtherPortal.portal, row.hiredFromOtherPortal.date)
              }>
              View Duplicacy Details
            </button>
          ) : (
            <span>-</span>
          )}
        </div>
      ),
    },
    actions: {
      key: "actions",
      label: "Actions",
      contentWidth: `max-w-none ${activeTab !== "Joined" ? "!min-w-auto" : ""} `,
      render: (row: JobApplicationDetailsDto) => (
        <JobApplicationActions
          row={row}
          activeTab={activeTab}
          userDetails={userDetails}
          userType={userType}
          isBulkEvaluation={isBulkEvaluation}
          handleStatusUpdate={handleStatusUpdate}
          setIsViewCVModalOpen={setIsViewCVModalOpen}
          setPdfViewDetails={setPdfViewDetailsID}
          setViewEvaluation={setViewEvaluation}
          setIsHireNowModalOpen={setIsHireNowModalOpen}
          setIsViewOfferIssue={setIsViewOfferIssue}
          setIsNoteModalOpen={setIsNoteModalOpen}
          setIsRejectModalOpen={setIsRejectModalOpen}
          setIsAddEvaluatorModalOpen={setIsAddEvaluatorModalOpen}
          setEvaluatorFormProps={setEvaluatorFormProps}
          setIsRequestDocModalOpen={setIsRequestDocModalOpen}
          sendApplicationToRecruiter={sendApplicationToRecruiter}
          setJoinedModalOpen={setJoinedModalOpen}
          handleMarkAsDuplicateJob={(action: "EDIT" | "VIEW") => {
            setDuplicateModalOpen({ isOpen: true, applicant: row, action: action });
          }}
        />
      ),
    },
    response: {
      key: "response",
      label: "Not Responding",
      render: () => (
        <div className="flex items-center justify-center">
          <button title="Not Responding">
            <img src={`${Not_Responding}`} alt="Not Responding" className="w-8 h-8" />
          </button>
        </div>
      ),
    },
    currentCompany: {
      key: "company",
      label: "Current Company",
      render: (row: JobApplicationDetailsDto) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={row?.applicantDetails?.candidateExperience?.companyName || "NA"}>
          {row?.applicantDetails?.candidateExperience?.companyName || "NA"}{" "}
        </span>
      ),
    },
    currentPosition: {
      key: "company",
      label: "Current Position",

      render: (row: JobApplicationDetailsDto) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={
            row?.applicantDetails?.candidateExperience?.designation ?? "FRESHER"
          }>
          {row.applicantDetails?.candidateExperience?.designation ?? "FRESHER"}{" "}
        </span>
      ),
    },
  };

  /**
   * Get column configuration based on active tab - enhanced with new columns
   */
  const getColumnsForTab = (tab: string): any[] => {
    switch (tab) {
      case "All":
        return [
          commonColumns.name,
          commonColumns.currentCompany,
          commonColumns.currentPosition,
          commonColumns.experience, // Enhanced from yoe
          // commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.status,
          commonColumns.IsWorko,
          // commonColumns.applicationDate, // New column
          // commonColumns.cvViewedDate, // New column
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Hired":
        return [
          commonColumns.name,
          commonColumns.currentCompany,
          commonColumns.currentPosition,
          commonColumns.experience,
          // commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.status,
          // commonColumns.applicationDate,
          // commonColumns.cvViewedDate,
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Joined":
        return [
          commonColumns.name,
          { key: "applicantDetails_CTC", label: "CTC", sortable: true },
          {
            key: "applicantDetails_candidateExperience_designation",
            label: "Designation",
            sortable: true,
          },
          { key: "hiredBy", label: "Hired By" },
          {
            key: "status_actionDate",
            label: "Joining Date",
            render: (row: JobApplicationDetailsDto) => (
              <div className="flex items-center justify-center gap-2">
                <span>
                  {new Date(getLatestOfferLetterIssueRaisedDetails(row).date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            ),
          },
          /*     {
            key: "actions",
            label: "Documents",
            render: (jobData: JobApplicationDetailsDto) => (
              <div className="flex gap-2 justify-center">
                <button
                  className="flex gap-2 items-center btn-sky"
                  onClick={() => {
                    jobData
                      ? handleViewDocumentClick(jobData)
                      : toast.error("Failed to view document", getToastOptions({}));
                  }}>
                  <Eye size={16} />
                  View Document
                </button>
              </div>
            ),
          }, */
          commonColumns.actions,
        ];
      default:
        return [];
    }
  };

  // Get columns for current tab
  const applicationColumns = getColumnsForTab(activeTab);

  /**
   * Toggle select all rows
   */
  /*   const toggleSelectAll = () => {
    if (ListSelection.selectedRows.length === data.length) {
      ListSelection.reset();
    } else {
      data.forEach((row) => ListSelection.toggleRow(row));
    }
  }; */

  /**
   * Toggle row expansion
   */
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  /**
   * Render expanded row details
   */
  const renderExpandedDetails = (row: JobApplicationDetailsDto) => {
    let timeLineProps: TimelineStep[] = [];
    if (row.status === "JOINED") {
      timeLineProps = jobApplicationServiceObj.getTimelineDetails(row);
    }
    return (
      <div className="flex justify-evenly flex-nowrap items-start gap-4">
        {row.status === "JOINED" && activeTab === "Joined" ? (
          <Timeline steps={timeLineProps} />
        ) : (
          <>
            <div className="">
              <span className="font-semibold text-gray-500">About</span>
              <div className="max-w-md">
                <p
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={row.applicantDetails.about}
                  className="text-wrap line-clamp-3">
                  {row.applicantDetails.about ?? "--------"}
                </p>
              </div>
            </div>

            <div className="">
              <span className="font-semibold text-gray-500">Location</span>
              <p>{row.applicantDetails?.location ?? "Not Disclosed"}</p>
            </div>

            <div className="">
              <span className="font-semibold text-gray-500">Application Date</span>
              <div className="flex items-center justify-center">
                <span>
                  {new Date(row.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {getCvViewDate(row.statusTracker) !== "-" && (
              <>
                <div className="">
                  <span className="font-semibold text-gray-500">Cv View Date</span>
                  <div className="flex items-center justify-center">
                    <span>{getCvViewDate(row.statusTracker)}</span>
                  </div>
                </div>

                <div className="">
                  <span className="font-semibold text-gray-500">Cv Viewed By</span>
                  <div className="flex items-center justify-center">
                    <span>
                      <CreatedByDisplay row={getCvDownloadedById(row)} mode="updated" />
                    </span>
                  </div>
                </div>
              </>
            )}

            {row.status === "REJECTED" ? (
              // Show rejection details
              <>
                <div>
                  <span className="font-semibold text-gray-500">Rejected by</span>
                  <p>
                    <CreatedByDisplay row={row} mode="updated" />
                  </p>
                </div>

                <div>
                  <div className="font-semibold text-gray-500">Reason</div>
                  <div className="max-w-lg">
                    {row.rejectedByUserId ? (
                      <>
                        <li className="list-disc list-inside">{row.rejectedByUserId.reason}</li>
                        {row.rejectedByUserId.userComment && (
                          <div>
                            <span className="font-semibold text-gray-500 mt-2 block">Comment</span>
                            <li className="list-disc list-inside">
                              {row.rejectedByUserId.userComment}
                            </li>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {jobApplicationServiceObj.getRejectionReason(row).length === 0 ? (
                          <p>--------</p>
                        ) : (
                          jobApplicationServiceObj.getRejectionReason(row).map((reason, index) => (
                            <li key={index} className="list-disc list-inside">
                              {reason}
                            </li>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Show application details
              <>
                <div>
                  <span className="font-semibold text-gray-500">Current CTC</span>
                  <p className="capitalize">
                    {row.applicantDetails.CTC ? `${row.applicantDetails.CTC} LPA` : "-"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Expected CTC</span>
                  <p className="capitalize">
                    {row.applicantDetails.ECTC ? `${row.applicantDetails.ECTC} LPA` : "-"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Notice</span>
                  <p className="capitalize">{row.applicantDetails.noticePeriod}</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Deselect button - only show when rows are selected */}
      <button
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${
          ListSelection.selectedRows.length === 0 ? "hidden" : ""
        }`}
        onClick={() => ListSelection.reset()}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
          &minus;
        </span>
        <span>deselect {ListSelection.selectedRows.length} rows</span>
      </button>

      {/* Main table component */}
      <DynamicTable
        columns={applicationColumns}
        rows={sortedData ?? []}
        selectedRows={ListSelection.selectedRows.map((row) => row.id)}
        expandedRows={expandedRows}
        toggleSelectAll={() => ListSelection.toggleSelectAll(data)}
        toggleRow={(id) => ListSelection.toggleRow(data.find((row) => row.id === id)!)}
        toggleExpand={toggleExpand}
        allSelected={ListSelection.getAllSelected(sortedData)}
        renderExpandedDetails={renderExpandedDetails}
        enableSelect={activeTab !== "Joined"}
        onSortChange={onSortChange}
        pageSize={Pagination.pageSize}
        setPageSize={Pagination.setPageSize}
        handlePreviousPage={Pagination.goToPreviousPage}
        handleNextPage={Pagination.goToNextPage}
        hasNextPage={Pagination.hasNextPage}
        hasPrevPage={Pagination.hasPreviousPage}
      />

      {/* Modal components */}
      <Modal
        isOpen={isViewCVModalOpen}
        onClose={() => {
          setIsViewCVModalOpen(false);
          setIsRejectModalOpen(null);
        }}
        className="w-[90vw] sm:max-w-4xl h-full">
        <CVPreview
          onClose={() => {
            setIsViewCVModalOpen(false);
            setIsRejectModalOpen(null);
          }}
          setIsAddEvaluatorModal={setIsAddEvaluatorModalOpen}
          setIsRejectModalOpen={(value) =>
            setIsRejectModalOpen(
              value as { payload: JobApplicationUpdatePayloadDto; jobId: string } | null
            )
          }
          setEvaluatorFormProps={setEvaluatorFormProps}
          jobApplicationData={
            data.find((row) => row.id === pdfViewDetailsID) as JobApplicationDetailsDto
          }
          activeTab="All"
        />
      </Modal>

      <Modal
        isOpen={isRejectModalOpen != null}
        onClose={() => setIsRejectModalOpen(null)}
        className="w-[90vw] sm:w-[455px] h-auto">
        {isRejectModalOpen && (
          <RejectionForm payload={isRejectModalOpen.payload} jobId={isRejectModalOpen.jobId} />
        )}
      </Modal>

      <Modal
        isOpen={isAddEvaluatorModalOpen}
        onClose={() => setIsAddEvaluatorModalOpen(false)}
        className="w-[90vw] sm:w-[455px] h-auto">
        {EvaluatorFormProps && (
          <EvaluatorForm
            Defaultvalues={EvaluatorFormProps?.Defaultvalues}
            isBulk={isBulkEvaluation}
            onBulkUpdate={onBulkUpdate}
            onClose={() => setIsAddEvaluatorModalOpen(false)}
            formLimit={evaluatorFormCount}
          />
        )}
      </Modal>

      <Modal
        isOpen={isHireNowModalOpen.isOpen}
        onClose={() =>
          setIsHireNowModalOpen({ isOpen: false, jobData: {} as JobApplicationDetailsDto })
        }
        className="w-[90vw] sm:w-[532px] h-[95vh] ">
        <HireNowForm jobData={isHireNowModalOpen.jobData} />
      </Modal>

      <Modal
        isOpen={isViewOfferIssue.isOpen}
        onClose={() =>
          setIsViewOfferIssue({ isOpen: false, jobData: {} as JobApplicationDetailsDto })
        }
        className="w-[90vw] sm:w-[532px] h-[95vh] ">
        <ResendOfferLetter jobData={isViewOfferIssue.jobData} />
      </Modal>

      <Modal
        isOpen={isRequestDocModalOpen.isOpen}
        onClose={() =>
          setIsRequestDocModalOpen({
            isOpen: false,
            jobApplication: {} as JobApplicationDetailsDto,
            mode: "REQUEST",
            onClose: () => setIsRequestDocModalOpen({ ...isRequestDocModalOpen, isOpen: false }),
          })
        }
        className="w-[90vw] sm:w-[455px] h-[500px] ">
        <RequestDocumentModal
          {...isRequestDocModalOpen}
          handleStatusUpdate={handleStatusUpdate}
          refetch={refetch}
        />
      </Modal>

      <Modal
        isOpen={FeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        className="h-full">
        {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
      </Modal>

      <Modal
        isOpen={isNoteModalOpen.isOpen}
        onClose={() => setIsNoteModalOpen({ isOpen: false, jobApplication: null })}
        className="w-full sm:max-w-4xl h-auto">
        {isNoteModalOpen.jobApplication && (
          <NotesApp jobApplication={isNoteModalOpen.jobApplication} />
        )}
      </Modal>

      <Modal
        isOpen={isViewEvaluator.isOpen}
        onClose={() => {
          setViewEvaluation({
            isOpen: false,
            jobApplicationData: {} as JobApplicationDetailsDto,
          });
        }}
        className="!p-0 m-0  ">
        {isViewEvaluator.jobApplicationData.status === "PROCESSING_INTERVIEW" && (
          <div className="processing_interview no-scrl no-scrl-web bg-blue-300 absolute bottom-0 text-xs  p-1 text-blue-600 mx-0 left-0 right-0 ">
            Under interview process
          </div>
        )}
        <ResponseEvaluation
          jobApplicationData={isViewEvaluator.jobApplicationData}
          handleUpdate={handleStatusUpdate}
          setIsRejectModalOpen={setIsRejectModalOpen}
          onClose={() => {
            setViewEvaluation({
              isOpen: false,
              jobApplicationData: {} as JobApplicationDetailsDto,
            });
          }}
          setOpenAddEvaluatorModal={(count, JobApplicationId: string) => {
            setEvaluatorFormCount(count);
            const applicantData = sortedData.find((row) => row.id === JobApplicationId);
            /* console.log("Applicant Data:", applicantData); */
            if (applicantData) {
              setEvaluatorFormProps({
                Defaultvalues: {
                  jobApplicationId: [applicantData.id],
                  jobId: applicantData.jobId,
                  jobTitle: applicantData.jobTitle,
                  applicantUserName: [applicantData.applicantDetails.name],
                  companyId: applicantData.companyId,
                  applicantUserId: [applicantData.applicantDetails.userId],
                  applicantUserEmail: [applicantData.applicantDetails.email],
                  hrName: userDetails?.fullName || "",
                  hrCurrentCompanyName: "WORKO",
                },
                isBulk: false,
                onClose: () => setIsAddEvaluatorModalOpen(false),
                formLimit: count,
              });
              setIsAddEvaluatorModalOpen(true);
            }
          }}
        />
      </Modal>
      <Modal
        isOpen={duplicateModalOpen.isOpen}
        onClose={() =>
          setDuplicateModalOpen({
            isOpen: false,
            applicant: {} as JobApplicationDetailsDto,
            action: "EDIT",
          })
        }
        className="w-fit p-5 sm:max-w-2xl h-auto">
        <Duplicacy
          action={duplicateModalOpen.action}
          applicant={duplicateModalOpen.applicant}
          onClose={() => {
            refetch();
            setDuplicateModalOpen({
              isOpen: false,
              applicant: {} as JobApplicationDetailsDto,
              action: "EDIT",
            });
          }}
        />
      </Modal>
      <Modal
        isOpen={joinedModalOpen.isOpen}
        onClose={() =>
          setJoinedModalOpen({
            isOpen: false,
            jobApplication: {} as JobApplicationDetailsDto,
          })
        }
        className="w-[90vw] sm:w-[455px] h-auto py-4">
        <JoinedModal jobApplication={joinedModalOpen.jobApplication} />
      </Modal>
    </>
  );
}
