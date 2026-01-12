import React, { memo, useState, useCallback, useMemo } from "react";
import { JobApiResponse, JobTypes, PaginationInfo } from "./JobTypes";
import { Check } from "lucide-react";
import { viewFeedback, iHaveJoined, checkAndAccept, askQuestion } from "@Assets";
import RejectionFeedbackModal from "./modals/RejectionFeedbackModal";
import SubmitDocumentModal from "./modals/SubmitDocumentModal";
import JobService from "../../Service/JobsService";
import { useDashboardContext } from "@Context/Dashboard.context";
import { Column, NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import Stepper from "./Stepper";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import CheckAcceptModal from "./modals/CheckAcceptModal";
import JoinedModal from "./modals/JoinedModal";
import httpServiceObj from "@Services/ApiHandler.service";
import RequestFolloupModal from "./modals/RequestFolloupModal";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import ScorePointsModal, { ScorePointsModalProps } from "@Components/Shared/DetailedAnalysis";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import Modal from "@Components/Shared/Modal";
import { useAppContext } from "@Context/App.context";
import ViewDetailsModal from "./modals/ViewDetailsModal";
import ProgressCircle from "@Components/Shared/CircularBarAgency";

interface JobsTableProps {
  data: JobApiResponse | null;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
  hasNextPage?: boolean; // Add this prop
  onLocalUpdate: (jobId: string, updatedData: Partial<JobTypes>) => void;
  handleFollowUpRequestUpdate: (jobId: string, newFollowUps: { actionDate: string }[]) => void;
  fetchCounts: () => void;
}

interface StepperProps {
  status: string;
}

const JobsTable = memo(
  ({
    data,
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
    onRefresh,
    hasNextPage, // Add this to destructured props
    onLocalUpdate,
    handleFollowUpRequestUpdate,
    fetchCounts,
  }: JobsTableProps) => {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackContent, setFeedbackContent] = useState<string>("");
    const [processingJobId, setProcessingJobId] = useState<string | null>(null);
    const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
    const [showJoinedModal, setShowJoinedModal] = useState<boolean>(false);
    const [showViewDetails, setShowViewDetails] = useState<boolean>(false);
    const [viewDetailsContent, setViewDetailsContent] = useState<string>("");
    const [jobTitle, setjobTitle] = useState<string>("");
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const { user } = useDashboardContext();
    const [expandedRows, setExpandedRows] = React.useState<string[]>([]);
    const [requestedDocumentsList, setRequestedDocumentsList] = useState<JobApplicationDetailsDto>();
    const [showCheckAcceptModal, setShowCheckAcceptModal] = useState(false);
    const [currentJobForCheckAccept, setCurrentJobForCheckAccept] = useState<JobApplicationDetailsDto | null>(null);
    const [modalMessage, setModalMessage] = React.useState<{
      message: string;
      isError: boolean;
      open: boolean;
    }>({ message: "", isError: false, open: false });
    const [parsingJobId, setParsingJobId] = useState<string>("");
    const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
    const [scorePointsModal, setScorePointsModal] = useState<ScorePointsModalProps>();

    const [isError, setIsError] = useState(false);
    const { userDetails } = useAppContext();
    // Map the status to action for the specific cases
    const getActionFromStatus = (status: string): string | null => {
      switch (status) {
        // case 'APPLIED':
        //   return null;
        // case 'CV_DOWNLOADED':
        //   return null;
        // case 'UNDER_EVALUATION':
        //   return null;
        case "REJECTED":
          return "VIEW_FEEDBACK";
        // case 'PROCESSING_INTERVIEW':
        //   return null;
        // case 'INTERVIEW_DONE':
        //   return null;
        // case 'HIRING_IN_PROCESS':
        //   return null;
        case "DOCUMENT_REQUESTED":
          return "SUBMIT_DOCUMENT";
        case "DOCUMENT_ADDITIONAL_REQUESTED":
          return "SUBMIT_DOCUMENT";
        case "DOCUMENT_REVISION_REQUESTED":
          return "SUBMIT_DOCUMENT";
        // case 'DOCUMENT_VERIFIED':
        //   return null;
        case "OFFER_SENT":
          return "CHECK_ACCEPT";
        // case 'OFFER_ISSUE_RAISED':
        //   return null;
        case "REVISED_OFFER_SENT":
          return "CHECK_ACCEPT";
        case "HIRED":
          return "JOINED";
        // case 'JOINED':
        //   return null;
        default:
          return null;
      }
    };

    // Process data to add actions based on status
    const processedJobs = data?.data?.map((job) => ({
      ...job,
      action: job.action || getActionFromStatus(job.status),
    })) as unknown as JobApplicationDetailsDto[];

    const jobs = processedJobs || [];

    // Function to handle opening the feedback modal
    const handleViewFeedback = useCallback((job: JobApplicationDetailsDto) => {
      const userComment = job?.rejectedByUserId?.userComment;
      const systemFeedback = job?.rejectionFeedbackBySystemForApplicant;

      if (userComment) {
        setFeedbackContent(userComment);
        setjobTitle(job?.jobTitle);
        setShowFeedbackModal(true);
      } else if (systemFeedback) {
        setFeedbackContent(systemFeedback);
        setjobTitle(job?.jobTitle);
        setShowFeedbackModal(true);
      } else {
        toast.error("No feedback found", getToastOptions({}));
      }
    }, []);

    //handling requestfollowup and modal
    const requestFollowup = async (id: string) => {
      const payload = { applicationDate: new Date().toISOString() };
      const url = `/job-application/${id}/request-feedback`;

      try {
        const { response, error } = await httpServiceObj.patch(
          url,
          payload,
          true,
          {},
          false,
          "JOB"
        );

        if (!error) {
          handleFollowUpRequestUpdate(id, [{ actionDate: new Date().toISOString() }]);
          setModalMessage({
            message:
              "Your request has been successfully sent to the HR team. Please check your email for feedback or a reply.",
            isError: false,
            open: true,
          });
        } else {
          setModalMessage({
            message: `Error: ${error.message}`,
            isError: true,
            open: true,
          });
        }
      } catch (err: any) {
        setModalMessage({
          message: `Error: ${err.message}`,
          isError: true,
          open: true,
        });
      }
    };
    const closeModal = () => {
      setModalMessage((prev) => ({ ...prev, open: false }));
      // if (!modalMessage.isError && onRefresh) {
      //   onRefresh(); // Call parent's refresh function
      // }
    };

    const handleSubmitDocs = (submittedFiles: Record<string, File | null>) => {
      // console.log("Submitted files:", submittedFiles);
      // TODO: handle file upload
    };

    const handleActionClick = useCallback(
      async (type: string, job: JobApplicationDetailsDto) => {
        if (!user?.email) return;

        setProcessingJobId(job.id);

        try {
          let result;

          switch (type) {
            case "VIEW_FEEDBACK":
              handleViewFeedback(job);
              // console.log(job);
              break;

            case "CHECK_ACCEPT":
              // result = await JobService.acceptOffer(job.id, user.email);
              // console.log(result)
              // if (result.response) {
              //   onRefresh();
              // }
              setCurrentJobForCheckAccept(job);
              setShowCheckAcceptModal(true);
              break;

            case "JOINED":
              // result = await JobService.markAsJoined(job.id, user.email);
              // if (result.response) {
              //   onRefresh();
              // }
              setCurrentJobForCheckAccept(job);
              setShowJoinedModal(true);
              break;

            case "SUBMIT_DOCUMENT":
              setShowDocumentUploadModal(true);
              // console.log(`Submit document for job ID: ${job.id}`);
              if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
                // console.log(job);
                setRequestedDocumentsList(job);
                setParsingJobId(job.id);
              }
              break;

            case "APPLIED":
              // console.log(`Already applied for job: ${job.id}`);
              break;

            case "CV_DOWNLOADED":
              // console.log(`CV downloaded for job: ${job.id}`);
              break;

            case "UNDER_EVALUATION":
              // console.log(`Job under evaluation: ${job.id}`);
              break;

            case "PROCESSING_INTERVIEW":
              // console.log(`Processing interview for job: ${job.id}`);
              break;

            case "INTERVIEW_DONE":
              // console.log(`Interview completed for job: ${job.id}`);
              break;

            case "HIRING_IN_PROCESS":
              // console.log(`Hiring in process for job: ${job.id}`);
              break;

            case "DOCUMENT_REQUESTED":
              // console.log(`Document requested for job: ${job.id}`);
              break;

            case "DOCUMENT_REVISION_REQUESTED":
              setShowDocumentUploadModal(true);
              // console.log(`Submit document for job ID: ${job.id}`);
              if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
                // console.log(job);
                setRequestedDocumentsList(job);
                setParsingJobId(job.id);
              }
              break;

            case "DOCUMENT_ADDITIONAL_REQUESTED":
              setShowDocumentUploadModal(true);
              // console.log(`Submit document for job ID: ${job.id}`);
              if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
                // console.log(job);
                setRequestedDocumentsList(job);
                setParsingJobId(job.id);
              }
              break;

            default:
              console.warn(`Unhandled action type: ${type}`);
              break;
          }
        } catch (error) {
          console.error(`Error processing action ${type}:`, error);
        } finally {
          setProcessingJobId(null);
        }
      },
      [handleViewFeedback, onRefresh, user?.email]
    );

    const MatchingScoreCircle = memo(
      ({
        score,
        scoreDetails,
        status,
        jobTitle,
      }: {
        score: number;
        scoreDetails?: any;
        status?: string;
        jobTitle: string;
      }) => (
        <div className="w-20 flex flex-col items-center justify-center gap-1 text-base text-green-500">
          <div className="w-16 relative h-16 flex items-center justify-center">
            <svg className="absolute scale-[80%]" width="65" height="65" viewBox="0 0 65 65">
              <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#eee" strokeWidth="5" />
              <circle
                cx="32.5"
                cy="32.5"
                r="30"
                fill="none"
                stroke="#4cbc9a"
                strokeWidth="5"
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                transform="rotate(-90 32.5 32.5)"
              />
            </svg>
            <div className="absolute font-semibold text-xs">{score}%</div>
          </div>
          {status !== "REJECTED" && (
            <button
              onClick={() => {
                // console.log(scoreDetails)
                setShowViewDetails(true);
                setViewDetailsContent(scoreDetails);
                setjobTitle(jobTitle);
              }}
              className="text-[9px] font-semibold text-gray-500 text-center leading-none">
              View details
            </button>
          )}
        </div>
      )
    );

    const StatusBadge = memo(({ status }: { status: string }) => {
      const statusConfigs: Record<
        JobApplicationStatusType,
        { bg: string; text: string; label: string; showDot?: boolean }
      > = {
        ALL: { bg: "bg-blue-100", text: "text-blue-500", label: "All" },
        ACCEPTED: { bg: "bg-blue-100", text: "text-blue-500", label: "Accepted" },
        APPLIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Applied" },
        CV_DOWNLOADED: { bg: "bg-blue-100", text: "text-blue-500", label: "CV downloaded" },
        UNDER_EVALUATION: { bg: "bg-blue-100", text: "text-blue-500", label: "Under evaluation" },
        PROCESSING_INTERVIEW: {
          bg: "bg-blue-100",
          text: "text-blue-500",
          label: "Interview Process",
        },
        INTERVIEW_DONE: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview done" },
        HIRING_IN_PROCESS: { bg: "bg-blue-100", text: "text-blue-500", label: "Hiring in process" },
        DOCUMENT_REQUESTED: {
          bg: "bg-red-100",
          text: "text-red-500",
          label: "Document requested",
          showDot: true,
        },
        DOCUMENT_ADDITIONAL_REQUESTED: {
          bg: "bg-red-100",
          text: "text-red-500",
          label: "Additional document requested",
          showDot: true,
        },
        DOCUMENT_REVISION_REQUESTED: {
          bg: "bg-red-100",
          text: "text-red-500",
          label: "Revision document requested",
          showDot: true,
        },
        DOCUMENT_SUBMITTED: {
          bg: "bg-blue-100",
          text: "text-blue-500",
          label: "Document submitted",
        },
        DOCUMENT_REVISION_REQUEST_SUBMITTED: {
          bg: "bg-purple-100",
          text: "text-purple-500",
          label: "Revision document submitted",
        },
        DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED: {
          bg: "bg-orange-100",
          text: "text-orange-500",
          label: "Additional document submitted",
        },
        OFFER_SENT: {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Offer letter received",
          showDot: true,
        },
        REVISED_OFFER_SENT: {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Revised letter received",
          showDot: true,
        },
        REVISED_LETTER: {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Revised letter received",
          showDot: true,
        },
        HIRED: { bg: "bg-green-100", text: "text-green-500", label: "Hired" },
        JOINED: { bg: "bg-green-100", text: "text-green-500", label: "Joined" },
        OFFER_ACCEPTED: { bg: "bg-green-100", text: "text-green-500", label: "Offer accepted" },
        OFFER_ISSUE_RAISED: {
          bg: "bg-blue-100",
          text: "text-blue-500",
          label: "Offer issue Raised",
        },
        REJECTED: { bg: "bg-red-400", text: "text-white", label: "Rejected" },
        ON_HOLD: { bg: "bg-red-400", text: "text-white", label: "On hold" },
        DOCUMENT_VERIFIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Document verified" },
        AWAITING: { bg: "bg-blue-100", text: "text-blue-500", label: "Accepted" },
      };

      const config =
        statusConfigs[status as JobApplicationStatusType] || statusConfigs.UNDER_EVALUATION;

      return (
        <div
          className={`relative rounded-full ${config.bg} px-3 py-2 flex items-center justify-center ${config.text} text-center max-w-[160px] m-4`}>
          <div
            className="tracking-wide leading-snug text-xs truncate whitespace-nowrap overflow-hidden"
            title={config.label}>
            {config.label}
          </div>

          {/*Red Dot */}
          {config.showDot && (
            <span className="absolute -top-1 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </div>
      );
    });

    const ActionButton = memo(
      ({
        type,
        job,
        fetchCounts,
      }: {
        type: string;
        job: JobApplicationDetailsDto;
        fetchCounts: () => void;
      }) => {
        // console.log(job)
        const isProcessing = processingJobId === job.id;

        const actionConfigs: Record<
          string,
          { color: string; icon: JSX.Element | null; label: string }
        > = {
          HIRED: {
            color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
            icon: <Check strokeWidth={3.25} className="w-5 h-5 mr-1" />,
            label: "I am hired",
          },
          JOINED: {
            color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
            icon: <img src={iHaveJoined} alt="I have joined" />,
            label: "I have joined",
          },
          SUBMIT_DOCUMENT: {
            color: "bg-blue-400",
            icon: null,
            label: "Submit document",
          },
          CHECK_ACCEPT: {
            color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
            icon: <img src={checkAndAccept} alt="Check & accept" />,
            label: "Check & accept",
          },
          VIEW_FEEDBACK: {
            color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
            icon: <img src={viewFeedback} alt="View feedback" />,
            label: "View feedback",
          },
          ADDITIONAL_DOCUMENT_REQUESTED: {
            color: "bg-yellow-400",
            icon: null,
            label: "Submit additional document",
          },
          REVISION_DOCUMENT_SUBMISSION: {
            color: "bg-orange-400",
            icon: null,
            label: "Submit revision document",
          },
        };

        const config = actionConfigs[type];
        if (!config) return null;

        return (
          <button
            className={`w-36 rounded-xl ${
              config.color
            } h-11 flex items-center justify-center py-2 px-4 gap-0.5 text-white ${
              isProcessing ? "opacity-75 cursor-not-allowed" : ""
            }`}
            onClick={() => {
              if (!isProcessing) {
                handleActionClick(type, job);
                // fetchCounts();
              }
            }}
            disabled={isProcessing}>
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              config.icon
            )}
            <div className="leading-normal font-semibold">
              {isProcessing ? "Processing..." : config.label}
            </div>
          </button>
        );
      }
    );

    // Define columns for the table
    const columns = [
      {
        key: "jobTitle",
        label: "Job Title",
        sortable: true,
        render: (row: JobApplicationDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            <span className="truncate block w-full" 
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row?.jobTitle}
              data-tooltip-place="top">
              {row.jobTitle}
            </span>
          </div>
        ),
      },
      {
        key: "companyName",
        label: "Company",
        sortable: true,
        contentWidth: `max-w-[150px]`,
        render: (row: JobApplicationDetailsDto) => row.companyName
        //   (
        //   <div className="flex justify-center m-auto w-[150px]">
        //     <span className="truncate block w-full">
        //       {row.companyName}
        //     </span>
        //   </div>
        // ),
      },
      {
        key: "createdAt",
        label: "Apply Date",
        sortable: true,
        render: (row: JobApplicationDetailsDto) => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        key: "matchingScore",
        label: "Matching Score",
        sortable: true,
        render: (row: JobApplicationDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            {/* <MatchingScoreCircle
              score={row.matchingScore ?? 0}
              scoreDetails={row}
              status={row.status}
              jobTitle={row.jobTitle}
            /> */}
              <ProgressCircle
                onClick={() => {
                let strengths = [];
                const applicantRaw = row?.scoreDetailsForApplicant;
                // if(!applicantRaw) return
                if (typeof applicantRaw === 'string' && applicantRaw.trim() !== '') {
                  try {
                    const parsed = JSON.parse(applicantRaw);
                    if (parsed.CandidateNote) {
                      strengths = parsed.CandidateNote;
                    }
                  } catch (e) {
                    console.error('Failed to parse scoreDetailsForApplicant:', e);
                  }
                }

                // if (strengths.length === 0) {
                //   const recruiterRaw = row?.scoreDetails;
                //   if (typeof recruiterRaw === 'string' && recruiterRaw.trim() !== '') {
                //     try {
                //       const parsed = JSON.parse(recruiterRaw);
                //       if (parsed.RecruiterNote) {
                //         strengths = parsed.RecruiterNote;
                //       }
                //     } catch (e) {
                //       console.error('Failed to parse scoreDetails:', e);
                //     }
                //   }
                // }
                  setFeedbackModalOpen(true);
                  setScorePointsModal({
                    title: `Feedback summary`,
                    data: strengths.length ? strengths : undefined,
                    matchingScore: row.matchingScore ?? 0,
                    candidateName: row?.jobTitle,
                    details: true,
                    showCloseButton: true,
                    onClose: () => setFeedbackModalOpen(false),
                    isShowDetails:true
                  });
                }}
                value={row?.matchingScore ?? 0}
              />
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        contentWidth: "max-w-none !min-w-52",
        render: (row: JobApplicationDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row?.status?.replace(/_/g, " ")}
              data-tooltip-place="top">
            <StatusBadge status={row?.status} />
          </div>
        )
      },
      {
        key: "action",
        label: "Action",
        sortable: true,
        render: (row: JobApplicationDetailsDto) =>
          row.action ? (
            <div className="flex justify-center m-auto w-[150px]">
              <ActionButton type={row.action} job={row} fetchCounts={fetchCounts} />
            </div>
          ) : null,
      },
      {
        key: "followUp",
        label: "Follow up",
        render: (row: JobApplicationDetailsDto) => {
          const isDisabled = !!row.followUpRequest?.[0];

          return (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="relative group">
                {row.status !== "JOINED" && row.status !== "REJECTED" ? (
                  <button
                    onClick={() => !isDisabled && requestFollowup(row.id)}
                    disabled={isDisabled}
                    className={`w-14 h-11 rounded-xl flex items-center justify-center transition-all
            ${
              isDisabled
                ? "bg-gray-300 cursor-not-allowed grayscale"
                : "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6] hover:brightness-105"
            }`}>
                    <img
                      src={askQuestion}
                      alt="Ask question"
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={`${!isDisabled ? `Request a follow up` : ""}`}
                      data-tooltip-place="top"
                      className={`transition-all ${isDisabled ? "opacity-60" : ""}`}
                    />
                  </button>
                ) : null}

                {/* Hover on disabled feedback */}
                {isDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity bg-white/80 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-md px-4 py-2">
                    Follow up already sent
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
    ];

    const handlePageSizeChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
      if (typeof value === "number") {
        setPageSize(value);
        onPageSizeChange(value);
      } else {
        setPageSize((prev) => {
          const newValue = value(prev);
          onPageSizeChange(newValue);
          return newValue;
        });
      }
    };

    const sortData = (
      data: JobApplicationDetailsDto[],
      field: string
    ): JobApplicationDetailsDto[] => {
      if (!field) return data;

      return [...data].sort((a: any, b: any) => {
        let aValue = a[field];
        let bValue = b[field];

        // Special handling for dates
        if (field === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Special handling for numbers
        if (field === "matchingScore") {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    };

    // Modify your handleSortChange function
    const handleSortChange = (columnKey: string) => {
      if (sortField === columnKey) {
        // Toggle sort order if clicking the same column
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // Set new sort field and default to ascending
        setSortField(columnKey);
        setSortOrder("asc");
      }
    };

    // Add sorted data calculation
    const sortedData = useMemo(() => {
      return sortData(jobs, sortField);
    }, [jobs, sortField, sortOrder]);

    const renderExpandedDetails = (row: JobApplicationDetailsDto) => {
      const statusTracker = row.statusTracker;

      if (
        statusTracker?.length > 1 &&
        statusTracker[statusTracker.length - 1].newStatus === "REJECTED"
      ) {
        return null;
      }
      if (row.statusTracker && row.statusTracker.length > 0) {
        return <Stepper statusTracker={row.statusTracker} />;
        // return <Stepper statusTracker={row.statusTracker[row.statusTracker.length - 1]} />;
      }
      return null;
    };

    //old toogle
    //     const toggleExpand = (id: string) => {
    //   setExpandedRows(prev =>
    //     prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    //   );
    // };

    const toggleExpand = (id: string) => {
      const row = sortedData.find((item) => item.id === id);
      const latestStatus = row?.statusTracker?.[row.statusTracker.length - 1]?.newStatus;
      const isCurrentlyExpanded = expandedRows.includes(id);

      // Allow collapsing any row, but prevent expanding REJECTED rows
      if (!isCurrentlyExpanded && latestStatus === "REJECTED") {
        return; // Don't allow expansion for rejected rows
      }

      setExpandedRows((prev) =>
        prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
      );
    };

    // Function to check if a row is expandable
    const isRowExpandable = (row: JobApplicationDetailsDto): boolean => {
      const latestStatus = row?.statusTracker?.[row.statusTracker.length - 1]?.newStatus;
      return latestStatus !== "REJECTED";
    };

    /* console.log({
      paginationCount: pagination?.count,
      currentPage,
      pageSize,
      hasNextPage: pagination?.count > currentPage * pageSize,
    }); */

    return (
      <div className="w-full font-poppins">
        <div className="shadow-md h-full rounded-xl overflow-hidden">
          <NewDynamicTable
            columns={columns}
            rows={sortedData}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={hasNextPage}
            renderExpandedDetails={renderExpandedDetails}
            enableSelect={false}
            emptyStateMessage="No job applications found"
            emptyStateSubMessage="Try adjusting your search filters"
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            expandedRows={expandedRows}
            toggleExpand={toggleExpand}
            isRowExpandable={isRowExpandable}
            enableExpand={true}
          />
        </div>

        <RejectionFeedbackModal
          show={showFeedbackModal}
          jobTitle={jobTitle}
          feedbackContent={feedbackContent}
          onClose={() => setShowFeedbackModal(false)}
        />

        <ViewDetailsModal
          show={showViewDetails}
          jobTitle={jobTitle}
          viewDetailsContent={viewDetailsContent}
          onClose={() => setShowViewDetails(false)}
        />

        <SubmitDocumentModal
          userDetails={user}
          show={showDocumentUploadModal}
          documents={requestedDocumentsList}
          onClose={() => setShowDocumentUploadModal(false)}
          onSubmit={handleSubmitDocs}
          onSuccess={() => {
            setShowDocumentUploadModal(false);
            fetchCounts();
            // onRefresh();
          }}
          userID={user?.sub ?? ""}
          jobId={parsingJobId ?? ""}
          onLocalUpdate={onLocalUpdate}
        />

        {showCheckAcceptModal && currentJobForCheckAccept && (
          <CheckAcceptModal
            userDetails={user}
            job={currentJobForCheckAccept}
            onClose={() => setShowCheckAcceptModal(false)}
            onSuccess={() => {
              // onRefresh();
              setShowCheckAcceptModal(false);
              fetchCounts();
            }}
            onLocalUpdate={onLocalUpdate}
            // onConfirm={async () => {
            //   if (!user?.email || !currentJobForCheckAccept) return;
            //   const result = await JobService.acceptOffer(currentJobForCheckAccept.id, user.email);
            //   if (result.response) {
            //     onRefresh();
            //   }
            //   setShowCheckAcceptModal(false);
            // }}
          />
        )}

        <JoinedModal
          userDetails={user}
          job={currentJobForCheckAccept}
          isOpen={showJoinedModal}
          onClose={() => setShowJoinedModal(false)}
          onSuccess={() => {
            // onRefresh();
            setShowJoinedModal(false);
            fetchCounts();
          }}
          onLocalUpdate={onLocalUpdate}
          // onSubmit={(data) => {
          //   console.log("Form data:", data);
          //   // call JobService.markAsJoined(job.id, user.email, data)
          // }}
        />
        {modalMessage.open && (
          <RequestFolloupModal
            message={modalMessage.message}
            isError={modalMessage.isError}
            onClose={closeModal}
          />
        )}
        <Modal
            isOpen={feedbackModalOpen}
            onClose={() => setFeedbackModalOpen(false)}
            className="py-5">
            {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
          </Modal>
      </div>
    );
  }
);

JobsTable.displayName = "JobsTable";

export default JobsTable;
