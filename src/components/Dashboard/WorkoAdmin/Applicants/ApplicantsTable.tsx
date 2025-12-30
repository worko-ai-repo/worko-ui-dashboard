import React, { useState } from "react";
import { Eye, Loader2, NotebookIcon, Send, User } from "lucide-react";

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
import NotesApp from "@Components/Shared/ApplicantsPage/Notes";

// Assets and interfaces
import { Not_Responding } from "@Assets";
import {
  ApplicantDetails,
  JobApplicationDetailsDto,
  StatusTracker,
} from "@Interfaces/CorporateDashboard.dto";
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
import RejectionFeedback from "@Components/Shared/ApplicantsPage/RejectionFeedbackModal";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import InterviewDetailedViewModal from "@Components/Modals/SharedModals/Interview/InterviewDetailedViewModal";
import interviewService from "@Services/Interview.service";
import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import ApplicantExpandedRowDetails, {
  expandedExtraApplicationRow,
} from "@Components/Shared/ApplicantsPage/ApplicantExpandedData";

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
  isAllApplicants: boolean; // New prop to indicate if viewing all applicants
  onBulkUpdate: (JobApplicationStatusType: JobApplicationStatusType) => void; // Optional prop for bulk update functionality
  isUpdating?: boolean;
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
  const isUserIdTypeULID = cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID
    ? { updatedByUserId: cvDownloadedEntry?.userId || "" }
    : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
};

export const getRejectedById = (row: JobApplicationDetailsDto) => {
  const rejectedEntry = row.statusTracker?.find((entry) => entry.newStatus === "REJECTED");
  // ULID length is 26 characters and include - in the middle
  const isUserIdTypeULID = rejectedEntry?.userId?.includes("-");
  return isUserIdTypeULID
    ? { updatedByUserId: rejectedEntry?.userId || "" }
    : { updatedByCorporateUserId: rejectedEntry?.userId || "" };
};

export const getCurrentPositionCell = (row: ApplicantDetails) => {
  // Check the multiple candidate experience entries for the current company with empty endDate
  let currentExperience = row.multipleCandidateExperience?.find((exp) => !exp.endDate);
  if (!currentExperience) {
    // compare all end date to get the latest one
    currentExperience = row.multipleCandidateExperience
      ?.filter((exp) => exp.endDate) // Filter out experiences without endDate
      .sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime())?.[0]; // Sort by endDate descending and get first item
  }
  return currentExperience;
};

export const getLatestInterviewData = (interviewDetails: InterviewDto[], userId: string) => {
  // Sort interviews by date in descending order and return the latest one
  const sortedInterviews = interviewDetails.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestInterview = sortedInterviews[0];

  // Check if the latest interview doesn't have a score and if the current user has already requested it
  const isAlreadyRequested =
    latestInterview &&
    !latestInterview?.score &&
    latestInterview.requestedBy?.some((request) => request.corporateUserId === userId);

  return { interviewDetails: latestInterview, isAlreadyRequested };
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
  isAllApplicants,
  isUpdating = false,
}: ApplicationTableProps) {
  // State management for expanded rows and modals
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
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
  const [interviewDetailviewModal, setInterviewDetailviewModal] = useState<{
    isOpen: boolean;
    interviewDetails: InterviewDto;
    userName: string;
  }>({
    isOpen: false,
    interviewDetails: {} as InterviewDto,
    userName: "",
  });
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
  const [RejectionFeedbackModal, setRejectionFeedbackModal] = useState<{
    isOpen: boolean;
    application: JobApplicationDetailsDto;
  }>({ isOpen: false, application: {} as JobApplicationDetailsDto });
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  // Add dropdown state for status updates (improved functionality)
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");

  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    name: ["applicantDetails.name"],
    matchingScore: [
      "matchingScore",
      "scoreDetails.matchingScore",
      "scoreDetails.matchingScorePercentage",
    ],
    experience: ["applicantDetails.YOE", "yoe"],
    location: ["applicantDetails.location"],
    noticePeriod: ["applicantDetails.noticePeriod"],
    applicantDetails_candidateExperience_designation: [
      "applicantDetails.candidateExperience.designation",
    ],
    applicantDetails_CTC: ["applicantDetails.CTC"],
    currentCTC: ["applicantDetails.CTC"],
    ECTC: ["applicantDetails.ECTC"],
    IsRefelectedToRec: ["displayToCorporate"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: `applicants-${activeTab}`,
    persistInUrl: true,
    persistInLocalStorage: false,
    defaultSort: null,
  });

  // Wrapper to track which application is being updated
  const handleStatusUpdate = async (
    status: JobApplicationStatusType,
    row: JobApplicationDetailsDto,
    hasRefetch: boolean = true
  ) => {
    setUpdatingApplicationId(row.id);
    try {
      const payload: JobApplicationUpdatePayloadDto = {
        applicantName: row.applicantDetails.name,
        emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
        status,
        userId: userDetails ? userDetails?.id : "",
        userType,
      };
      handleUpdate(payload, row.id, hasRefetch);
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  // Common column definitions
  const commonColumns = {
    name: {
      key: "name",
      label: "Applicants name",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex font-semibold items-center justify-center gap-2">
          {/* <User size={20} /> */}
          <span>{row.applicantDetails.name}</span>
          {updatingApplicationId === row.id && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          )}
        </div>
      ),
    },
    jobProfile: {
      key: "jobTitle",
      label: "Job Profile",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <span data-tooltip-id="my-tooltip" data-tooltip-content={row?.jobTitle || "NA"}>
          {row?.jobTitle || "NA"}{" "}
        </span>
      ),
    },
    //@Changed
    currentPosition: {
      key: "currentPosition",
      label: "Current Position",
      contentWidth: ` min-w-[200px] `,
      render: (row: JobApplicationDetailsDto) => {
        const finalPosAndDesignation = `${
          getCurrentPositionCell(row?.applicantDetails)?.designation || "FRESHER"
        }${
          getCurrentPositionCell(row?.applicantDetails)?.companyName
            ? ` @ ${getCurrentPositionCell(row?.applicantDetails)?.companyName}`
            : ""
        }`;
        return (
          <span
            className="text-wrap line-clamp-3 w-full m-0"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={finalPosAndDesignation}>
            {finalPosAndDesignation}
          </span>
        );
      },
    },
    currentCTC: {
      key: "currentCTC",
      label: "Current CTC",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <span>
          {typeof row.applicantDetails?.CTC === "number" ? `${row.applicantDetails.CTC} LPA` : "-"}
        </span>
      ),
    },
    noticePeriod: {
      key: "noticePeriod",
      label: "Notice Period",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>
            {row.applicantDetails?.noticePeriod
              ? `${row.applicantDetails.noticePeriod} Days`
              : "N/A"}
          </span>
        </div>
      ),
    },
    experience: {
      key: "experience",
      label: "YOE",
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
    interviewScoreDetails: {
      key: "interviewScoreDetails",
      label: "Video Score",
      render: (row: JobApplicationDetailsDto) => {
        const hasInterviewDetails = row.applicantDetails?.interviewDetails?.length;

        if (!hasInterviewDetails) {
          // No interview details at all - show request button
          return (
            <div className="flex justify-center">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                onClick={async () => {
                  try {
                    const payload = jobApplicationServiceObj.generateInterviewRequestPayload({
                      candidateEmail: row.applicantDetails.email,
                      jobId: row.jobId,
                      candidateFullName: row.applicantDetails.name,
                      companyId: row.companyId,
                      companyName: row.companyName,
                      position: row.jobTitle,
                      requesterUserName: userDetails.fullName,
                    });
                    await interviewService.requestInterview(payload);
                    toast.success("Interview requested successfully", getToastOptions({}));
                    // Update the row silently
                    refetch();
                  } catch (error) {
                    toast.error("Failed to request interview", getToastOptions({}));
                  }
                }}
                title="Request Interview">
                <Send size={16} />
                Request Interview
              </button>
            </div>
          );
        }

        const { interviewDetails, isAlreadyRequested } = getLatestInterviewData(
          row.applicantDetails?.interviewDetails || [],
          userDetails?.id
        );

        // If interview has score, show the score
        if (interviewDetails?.score) {
          return (
            <div className="flex justify-center">
              <ProgressCircle
                onClick={() => {
                  const application = jobApplicationServiceObj.getScoreDetails(row);
                  if (application === null) return;
                  setInterviewDetailviewModal({
                    isOpen: true,
                    interviewDetails: interviewDetails,
                    userName: row.applicantDetails.name,
                  });
                }}
                value={interviewDetails.score}
              />
            </div>
          );
        }

        // If interview is already requested (no score but requested by current user)
        if (isAlreadyRequested) {
          return (
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                Already Requested
              </span>
            </div>
          );
        }

        // Interview exists but no score and not requested by current user - show request button
        return (
          <div className="flex justify-center">
            <button
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              onClick={async () => {
                try {
                  const payload = jobApplicationServiceObj.generateInterviewRequestPayload({
                    candidateEmail: row.applicantDetails.email,
                    jobId: row.jobId,
                    candidateFullName: row.applicantDetails.name,
                    companyId: row.companyId,
                    companyName: row.companyName,
                    position: row.jobTitle,
                    requesterUserName: userDetails.fullName,
                  });
                  await interviewService.requestInterview(payload);
                  toast.success("Interview requested successfully", getToastOptions({}));
                  // Update the row silently
                  refetch();
                } catch (error) {
                  toast.error("Failed to request interview", getToastOptions({}));
                }
              }}
              title="Request Interview">
              <Send size={16} />
              Request Interview
            </button>
          </div>
        );
      },
    },

    status: {
      key: "status",
      label: "Status",
      sortable: true,
      contentWidth: `mx-auto max-w-none !min-w-auto`,
      render: (row: JobApplicationDetailsDto) => {
        const colorClass =
          statusColors[row.status as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex justify-center mx-auto p-2 w-fit relative">
            <span
              onClick={() => {
                if (row.status === "REJECTED") {
                  setRejectionFeedbackModal({ isOpen: true, application: row });
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
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
    IsRefelectedToRec: {
      key: "IsRefelectedToRec",
      label: "Recruiter Visibility",
      render: (row: JobApplicationDetailsDto) => {
        return (
          <div className="flex items-center justify-center gap-2">
            {jobApplicationServiceObj?.isVisibleToCorporate(row) ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                Visible
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Not Visible
              </span>
            )}
          </div>
        );
      },
    },
    actions: {
      key: "actions",
      label: "Actions",
      contentWidth: `border-l border-r max-w-none ${activeTab !== "Joined" ? "!min-w-auto" : ""} `,
      render: (row: JobApplicationDetailsDto) => {
        const isExpanded = expandedRows.includes(row.id);
        return (
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
            splitMode={isExpanded ? "main" : "all"}
          />
        );
      },
    },
    response: {
      key: "response",
      label: "Not Responding",
      render: () => (
        <div className="flex items-center justify-center">
          <button data-tooltip-id="my-tooltip" data-tooltip-content="Mark as Not Responding">
            <img src={`${Not_Responding}`} alt="Not Responding" className="w-8 h-8" />
          </button>
        </div>
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
          ...(isAllApplicants ? [commonColumns.jobProfile] : []),
          // commonColumns.currentCompany,
          commonColumns.currentPosition,
          commonColumns.currentCTC,
          commonColumns.noticePeriod, //@Changed-New
          // commonColumns.ECTC,
          commonColumns.experience, // Enhanced from yoe
          // commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.interviewScoreDetails,
          commonColumns.status,
          commonColumns.IsWorko,
          commonColumns.IsRefelectedToRec,
          // commonColumns.applicationDate, // New column
          // commonColumns.cvViewedDate, // New column
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Hired":
        return [
          commonColumns.name,
          ...(isAllApplicants ? [commonColumns.jobProfile] : []),
          // commonColumns.currentCompany,
          commonColumns.currentPosition,
          commonColumns.currentCTC,
          commonColumns.noticePeriod,
          commonColumns.experience,
          // commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.interviewScoreDetails,
          commonColumns.status,
          // commonColumns.applicationDate,
          // commonColumns.cvViewedDate,
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Joined":
        return [
          commonColumns.name,
          ...(isAllApplicants ? [commonColumns.jobProfile] : []),
          {
            key: "applicantDetails_CTC",
            label: "CTC",
            sortable: true,
            render: (row: JobApplicationDetailsDto) => (
              <span>
                {typeof row.applicantDetails?.CTC === "number"
                  ? `${row.applicantDetails.CTC} LPA`
                  : "-"}
              </span>
            ),
          },
          {
            key: "applicantDetails_candidateExperience_designation",
            label: "Designation",
            sortable: true,
          },
          // { key: "hiredBy", label: "Hired By" },
          {
            key: "status_actionDate",
            label: "Joining Date",
            render: (row: JobApplicationDetailsDto) => {
              // Find the JOINED status in the status tracker
              const joinedStatus = row.statusTracker
                ?.slice()
                .reverse()
                .find((tracker) => tracker.newStatus === "JOINED");

              const joiningDate = joinedStatus?.actionDate
                ? new Date(joinedStatus.actionDate)
                : null;
              // Check if the date is valid
              const isValidDate = joiningDate && !isNaN(joiningDate.getTime());
              return (
                <div className="flex items-center justify-center gap-2">
                  <span>
                    {isValidDate
                      ? joiningDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
              );
            },
          },
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
    const isExpanded = expandedRows.includes(row.id);

    // Generate expanded actions (only secondary actions)
    const expandedActionsNode = isExpanded ? (
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
        handleMarkAsDuplicateJob={(action: "EDIT" | "VIEW") => {
          setDuplicateModalOpen({ isOpen: true, applicant: row, action: action });
        }}
        sendApplicationToRecruiter={sendApplicationToRecruiter}
        setJoinedModalOpen={setJoinedModalOpen}
        splitMode="expanded" // Show only expanded actions
      />
    ) : null;

    return (
      <ApplicantExpandedRowDetails
        row={row}
        activeTab={activeTab}
        jobApplicationServiceObj={jobApplicationServiceObj}
        getCvViewDate={getCvViewDate}
        getCvDownloadedById={getCvDownloadedById}
        getRejectedById={getRejectedById}
        expandedActions={expandedActionsNode}
      />
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
      <NewDynamicTable
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
        renderExpandedNodes={(row) => {
          const isExpanded = expandedRows.includes(row.id);

          // Generate expanded actions (only secondary actions)
          const expandedActionsNode = isExpanded ? (
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
              handleMarkAsDuplicateJob={(action: "EDIT" | "VIEW") => {
                setDuplicateModalOpen({ isOpen: true, applicant: row, action: action });
              }}
              sendApplicationToRecruiter={sendApplicationToRecruiter}
              setJoinedModalOpen={setJoinedModalOpen}
              splitMode="expanded" // Show only expanded actions
            />
          ) : null;

          // Return the expanded row details as an array
          return activeTab !== "Joined"
            ? expandedExtraApplicationRow(expandedActionsNode, row)
            : [];
        }}
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
          <RejectionForm
            payload={isRejectModalOpen.payload}
            jobId={isRejectModalOpen.jobId}
            onClose={() => setIsRejectModalOpen(null)}
          />
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
        <HireNowForm
          jobData={isHireNowModalOpen.jobData}
          onClose={() =>
            setIsHireNowModalOpen({ isOpen: false, jobData: {} as JobApplicationDetailsDto })
          }
        />
      </Modal>

      <Modal
        isOpen={isViewOfferIssue.isOpen}
        onClose={() =>
          setIsViewOfferIssue({ isOpen: false, jobData: {} as JobApplicationDetailsDto })
        }
        className="w-[90vw] sm:w-[532px] h-[95vh] ">
        <ResendOfferLetter
          jobData={isViewOfferIssue.jobData}
          onClose={() =>
            setIsViewOfferIssue({ isOpen: false, jobData: {} as JobApplicationDetailsDto })
          }
        />
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
          <div className="processing_interview no-scrl no-scrl-web text-center mx-auto bg-blue-300 absolute bottom-0 text-xs  p-1 text-blue-600 left-0 right-0 ">
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
                  cvAwsS3ResourceType: [applicantData.applicantDetails.cvAwsS3ResourceType],
                  candidateParsedCvId: [applicantData?.candidateParsedCvId || ""],
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

      <Modal
        isOpen={RejectionFeedbackModal.isOpen}
        onClose={() =>
          setRejectionFeedbackModal({
            isOpen: false,
            application: {} as JobApplicationDetailsDto,
          })
        }
        className=" sm:max-w-2xl min-w-[500px] min-h-[150px]">
        <RejectionFeedback jobApplication={RejectionFeedbackModal.application} />
      </Modal>

      <Modal
        isOpen={interviewDetailviewModal.isOpen}
        onClose={() =>
          setInterviewDetailviewModal({
            isOpen: false,
            interviewDetails: {} as InterviewDto,
            userName: "",
          })
        }>
        <InterviewDetailedViewModal
          userName={interviewDetailviewModal.userName}
          interviewDetails={interviewDetailviewModal.interviewDetails}
        />
      </Modal>
    </>
  );
}
