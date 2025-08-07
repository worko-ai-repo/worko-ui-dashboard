import React, { useState } from "react";
import { Eye, NotebookIcon, Send, User } from "lucide-react";

// Component imports
import CVPreview from "@Components/Shared/ApplicantsPage/CVPreview";
import RejectionForm from "@Components/Shared/ApplicantsPage/RejectForm"; 
import EvaluatorForm, { EvaluatorFormProps } from "@Components/Shared/ApplicantsPage/EvaluatorForm";
import HireNowForm from "@Components/Shared/ApplicantsPage/HireNowForm";
import ProgressCircle from "../../../Shared/CircularBar";
import RequestDocumentModal from "@Components/Shared/ApplicantsPage/RequestDocModal"; 
import Modal from "../../../Shared/Modal";
import { DynamicTable } from "../../../Shared/DynamicTable";
import NotesApp from "@Components/Shared/ApplicantsPage/Notes"; 

// Assets and interfaces
import { hireNow, Not_Responding, onHold } from "@Assets";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { ApplicationListSelectionDto, JobApplicationStatusType, JobApplicationUpdatePayloadDto } from "./Applicants";
import ScorePointsModal, { ScorePointsModalProps } from "@Components/Shared/DetailedAnalysis";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { CorporateUserDetail, useAppContext } from "@Context/App.context";
import { CommonCursorPaginationProp } from "src/types/interface/CorporateServices.dto";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { NormalizedUser } from "@Utils/NormalizeUser";

// Component props interface
interface ApplicationTableProps {
  activeTab: "All" | "Hired" | "Joined";
  setActiveTab: (tab: "All" | "Hired" | "Joined") => void;
  ListSelection: ApplicationListSelectionDto;
  data: JobApplicationDetailsDto[];
  handleUpdate: (payload: JobApplicationUpdatePayloadDto, jobId: string) => void;
  userType: string;
  Pagination: CommonCursorPaginationProp;
  isAddEvaluatorModalOpen: boolean;
  setIsAddEvaluatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  EvaluatorFormProps: EvaluatorFormProps | null;
  setEvaluatorFormProps: React.Dispatch<React.SetStateAction<EvaluatorFormProps | null>>;
  // Add these new props to match improved functionality
  sendApplicationToRecruiter?: (applicationId: string) => void;
  showRejectReason?: (application: JobApplicationDetailsDto) => void;
  viewDuplicacyDetails?: (portal: string, date: string) => void;
  formatCvDownloadedDate?: (statusTracker: any) => string;
}

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
  formatCvDownloadedDate
}: ApplicationTableProps) {
  // State management for expanded rows and modals
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<{
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  } | null>(null);
  const [isHireNowModalOpen, setIsHireNowModalOpen] = useState(false);
  const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState(false);
  const [FeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [scorePointsModal, setScorePointsModal] = useState<ScorePointsModalProps>();
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const [pdfViewDetails, setPdfViewDetails] = useState<{
    pdfUri: string | undefined;
    mode: JobApplicationStatusType;
    misData: {
      payload: JobApplicationUpdatePayloadDto;
      jobId: string;
    };
  }>();

  // Add dropdown state for status updates (improved functionality)
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");

  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    matchingScore: ["matchingScore", "scoreDetails.matchingScore", "scoreDetails.matchingScorePercentage"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);

  // Helper functions (improved functionality)
  const shouldShowUpdateIcon = (row: JobApplicationDetailsDto) => {
    return row.status !== "REJECTED" && row.status !== "HIRED";
  };

  const toggleDropdown = (rowIndex: string) => {
    setDropdownVisibleRows(prev => 
      prev.includes(rowIndex) 
        ? prev.filter(id => id !== rowIndex)
        : [...prev, rowIndex]
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
    "REJECTED"
  ];

  const isOptionDisabled = (option: string, currentStatus: string) => {
    const statusOrder = {
      "APPLIED": 0,
      "CV_DOWNLOADED": 1,
      "UNDER_EVALUATION": 2,
      "PROCESSING_INTERVIEW": 3,
      "INTERVIEW_DONE": 4,
      "HIRED": 5,
      "REJECTED": 6
    };
    
    return option !== "REJECTED" && statusOrder[option as keyof typeof statusOrder] <= statusOrder[currentStatus as keyof typeof statusOrder];
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
      ON_HOLD: "On Hold"
    };
    return statusMap[status] || status;
  };

  // Common column definitions - keeping original styling with improved functionality
  const commonColumns = {
    name: {
      key: "name",
      label: "Applicants name", // Keep original label
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <User size={20} />
          <span>{row.applicantDetails.name}</span>
        </div>
      ),
    },
    profile: {
      key: "profile",
      label: "Profile",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails?.candidateExperience?.designation ?? "FRESHER"}</span>
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
    experience: {
      key: "experience", 
      label: "Experience",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>
            {row.applicantDetails.YOE 
              ? (row.applicantDetails.YOE === 1 
                  ? `${row.applicantDetails.YOE} year` 
                  : `${row.applicantDetails.YOE} years`)
              : '0 years'
            }
          </span>
        </div>
      ),
    },
    location: {
      key: "location",
      label: "Location",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails?.location ?? "Not Disclosed"}</span>
        </div>
      ),
    },
    currentCTC: {
      key: "currentCTC",
      label: "Current CTC", 
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails.CTC ? `${row.applicantDetails.CTC} LPA` : '-'}</span>
        </div>
      ),
    },
    expectedCTC: {
      key: "expectedCTC",
      label: "Expected CTC",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails.ECTC ? `${row.applicantDetails.ECTC} LPA` : '-'}</span>
        </div>
      ),
    },
    currentCompany: {
      key: "currentCompany",
      label: "Current Company",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2" title={row.applicantDetails?.candidateExperience?.companyName}>
          <span className="truncate max-w-[120px]">
            {row.applicantDetails?.candidateExperience?.companyName 
              ? row.applicantDetails.candidateExperience.companyName.slice(0, 20).toUpperCase()
              : '-'
            }
          </span>
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

              setScorePointsModal({
                title: row.matchingScore ?? 0 >= 70 ? "Matching Score Details" : "Rejected Reason",
                data: row.matchingScore ?? 0 >= 70 ? row.scoreDetails : row.rejectionFeedbackBySystem,
                matchingScore: row.matchingScore ?? 0,
                details: true,
                showCloseButton: true,
                onClose: () => setFeedbackModalOpen(false),
              });
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
              }}
            >
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
      render: (row: JobApplicationDetailsDto) => {
        // Status color mapping - keeping original colors
        const statusColors: Record<JobApplicationStatusType, string> = {
          APPLIED: "bg-[#D6F4FF] text-[#00ADC0]",
          REJECTED: "bg-[#FFD0D0] text-[#D40000]",
          UNDER_EVALUATION: "bg-[#EFEFEF] text-[#616161]",
          PROCESSING_INTERVIEW: "bg-green-100 text-green-500",
          HIRED: "bg-[#4CBC9A38] text-[#00BF29]",
          CV_DOWNLOADED: "bg-[#00ADC0] text-[#D6F4FF]",
          INTERVIEW_DONE: "bg-[#E3F7F7] text-[#008B8B]",
          ALL: "bg-[#E6E4FF] text-[#5C55D4]",
          ON_HOLD: "bg-[#FFF3CD] text-[#856404]",
          JOINED: "bg-[#D1E7DD] text-[#0F5132]",
        };
        
        const newDisplayStatus: Record<JobApplicationStatusType, string> = {
          APPLIED: "Pending",
          REJECTED: "Rejected",
          UNDER_EVALUATION: "Evaluation Pending",
          PROCESSING_INTERVIEW: "Interviewing",
          HIRED: "Hired",
          CV_DOWNLOADED: "Accepted",
          INTERVIEW_DONE: "Interview Done",
          ALL: "All",
          ON_HOLD: "On Hold",
          JOINED: "Joined",
        };

        const colorClass = statusColors[row.status as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span 
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass} ${row.status === 'REJECTED' ? 'cursor-pointer' : ''}`}
                onClick={() => row.status === 'REJECTED' && showRejectReason && showRejectReason(row)}
              >
                {newDisplayStatus[row.status as JobApplicationStatusType]}
              </span>
              {shouldShowUpdateIcon(row) && (
                <button
                  className="text-blue-600 hover:text-blue-800"
                  title="Update status"
                  onClick={() => toggleDropdown(row.id)}
                >
                  ✏️
                </button>
              )}
            </div>
            
            {isDropdownVisible(row.id) && (
              <div className="flex flex-col gap-2 p-2 border rounded bg-white shadow-lg">
                <select 
                  className="form-select text-sm border rounded p-1"
                  value={selectedStatusDropdown}
                  onChange={(e) => setSelectedStatusDropdown(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="" disabled>Select Next Status</option>
                  {statusArray.map(option => (
                    <option 
                      key={option}
                      value={option}
                      disabled={isOptionDisabled(option, row.status)}
                    >
                      {transformStatus(option)}
                    </option>
                  ))}
                </select>
                <button 
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                  disabled={!selectedStatusDropdown}
                  onClick={() => {
                    if (selectedStatusDropdown) {
                      const payload: JobApplicationUpdatePayloadDto = {
                        applicantName: row.applicantDetails.name,
                        emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
                        status: selectedStatusDropdown as JobApplicationStatusType,
                        userId: userDetails ? userDetails?.id : "",
                        userType: userType,
                      };
                      handleUpdate(payload, row.id);
                      setDropdownVisibleRows(prev => prev.filter(id => id !== row.id));
                      setSelectedStatusDropdown("");
                    }
                  }}
                >
                  Update
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    applicationDate: {
      key: "applicationDate", 
      label: "Application Date",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center">
          <span>
            {new Date(row.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
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
          <span>{formatCvDownloadedDate ? formatCvDownloadedDate(row.statusTracker) : '-'}</span>
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
              onClick={() => row.hiredFromOtherPortal && viewDuplicacyDetails && viewDuplicacyDetails(row.hiredFromOtherPortal.portal, row.hiredFromOtherPortal.date)}
            >
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
      render: (row: JobApplicationDetailsDto) => {
        // Common action buttons - keeping original styling
        const viewCvBtn = (
          <button
            title="View CV"
            onClick={() => {
              setIsViewCVModalOpen(true);
              setPdfViewDetails({
                pdfUri: row.applicantDetails.cvAwsS3SignedUrl,
                mode: row.status as JobApplicationStatusType,
                misData: {
                  payload: {
                    applicantName: row.applicantDetails.name,
                    emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
                    status: row.status as JobApplicationStatusType,
                    userId: userDetails ? userDetails?.id : "",
                    userType: userType,
                  },
                  jobId: row.id,
                },
              });
            }}
            className="flex gap-2 items-center btn-sky">
            <Eye size={16} />
            View Cv
          </button>
        );

        const sendToRecevaluatorBtn = (
          <button
            title="Send to Evaluator"
            onClick={() => {
              setIsAddEvaluatorModalOpen(true);
              setEvaluatorFormProps({
                Defaultvalues: {
                  jobApplicationId: [row.id],
                  jobId: row.jobId,
                  applicantUserName: [row.applicantDetails.name],
                  jobTitle: row.jobTitle,
                  companyId: row.companyId,
                  applicantUserId: [row.applicantDetails.userId],
                  applicantUserEmail: [row.applicantDetails.email],
                  hrName: userDetails?.fullName,
                  hrCurrentCompanyName: userDetails?.companyId || "",
                },
              });
            }}
            className="flex items-center gap-2 btn-sky">
            <Eye size={16} />
            Send to Evaluator
          </button>
        );

        const hireNowBtn = (
          <button title="Hire Now" onClick={() => setIsHireNowModalOpen(true)} className="btn-sky flex gap-2 items-center">
            <img src={hireNow} alt="hireNow" className="h-[19px] w-[18px]" />
            Hire Now
          </button>
        );

        const holdBtn = (
          <button
            title="Hold"
            className="flex gap-2 items-center btn-blue"
            onClick={() => {
              const payload: JobApplicationUpdatePayloadDto = { applicantName: row.applicantDetails.name, emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "", status: "ON_HOLD", userId: userDetails ? userDetails?.id : "", userType: userType };
              handleUpdate(payload, row.id);
            }}>
            <img src={onHold} alt="onHold" className="h-[19px] w-[18px]" />
            on Hold
          </button>
        );

        const noteBtn = (
          <button title="Add Note" className="flex gap-2 items-center btn-sky" onClick={() => setIsNoteModalOpen(true)}>
            <NotebookIcon size={16} />
            Add Note
          </button>
        );

        const sendToRecruiterBtn = (
          <button
            title={row.displayToCorporate ? "Already sent to recruiter" : "Send to Recruiter"}
            onClick={() => !row.displayToCorporate && sendApplicationToRecruiter && sendApplicationToRecruiter(row.id)}
            disabled={row.displayToCorporate}
            className={`flex gap-2 items-center bg-green-600 text-white p-2 rounded-xl ${
              row.displayToCorporate 
                ? 'btn-gray cursor-not-allowed opacity-60' 
                : 'btn-sky'
            }`}
          >
            <Send size={16} />
            Send to Recruiter
          </button>
        );

        // Return different actions based on tab and status
        if (activeTab === "All") {
       /*    if (row.status === "APPLIED") {
            return (
              <div className="flex space-x-2 justify-center">
                <button
                  title="Accept"
                  onClick={() => {
                    const payload: JobApplicationUpdatePayloadDto = { applicantName: row.applicantDetails.name, emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "", status: "CV_DOWNLOADED", userId: userDetails ? userDetails?.id : "", userType: userType };
                    handleUpdate(payload, row.id);
                  }}
                  className="bg-emerald-400 hover:bg-emerald-500 px-3 py-2 rounded-[10px] text-white">
                  ✔
                </button>
                <button
                  title="Reject"
                  onClick={() => {
                    const payload: JobApplicationUpdatePayloadDto = { applicantName: row.applicantDetails.name, emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "", status: "REJECTED", userId: userDetails ? userDetails?.id : "", userType: userType };
                    setIsRejectModalOpen({ payload, jobId: row.id });
                  }}
                  className="bg-red-500 hover:bg-red-600 p-3 py-2 rounded-[10px] text-white">
                  ✖
                </button>
              </div>
            );
          } else  */if (row.status === "CV_DOWNLOADED") {
            return (
              <div className="flex gap-2 justify-center">
                {viewCvBtn}
                {sendToRecevaluatorBtn}
              </div>
            );
          }

          const statusActions: JobApplicationStatusType[] = ["UNDER_EVALUATION", "PROCESSING_INTERVIEW", "HIRED"];
          if (statusActions.includes(row.status as JobApplicationStatusType)) {
            return (
              <div className="flex gap-2 justify-center">
                {viewCvBtn}
                {noteBtn}
              </div>
            );
          } else if (row.status === "REJECTED") {
            // Show rejection date for rejected applications
            return <div className="flex gap-2 justify-center">{viewCvBtn}</div>; // No actions for rejected applications
          } else {
            // Show "Send to Recruiter" button based on improved logic
            const showSendToRecruiter = row.status !== "REJECTED" && 
              (((row.matchingScore ?? 0) < 70 && row.rejectionFeedbackBySystem) ||
               ((row.matchingScore ?? 0) >= 90 && row.scoreDetails));
            
            return (
              <div className="flex gap-2 justify-center">
                {viewCvBtn}
                {showSendToRecruiter && sendToRecruiterBtn}
                {/* <span>---------</span> */}
              </div>
            );
          }
        }

        if (activeTab === "Hired") {
          if (false) {
            //@TODO add document submitted
            return (
              <div className="flex gap-2 justify-center">
                <button title="Request Document" onClick={() => setIsRequestDocModalOpen(true)} className="flex items-center gap-2 btn-dark">
                  <Eye size={16} />
                  Request Document
                </button>
                {hireNowBtn}
                {holdBtn}
              </div>
            );
          }

          return (
            <div className="flex gap-2 justify-center">
              <button title="View Document" className="flex gap-2 items-center btn-sky">
                <Eye size={16} />
                View Document
              </button>
              {hireNowBtn}
              {holdBtn}
            </div>
          );
        }

        return null;
      },
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
    company: {
      key: "company",
      label: "Company",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.companyName}</span>
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
          commonColumns.company, 
          commonColumns.profile,
          commonColumns.experience, // Enhanced from yoe
          commonColumns.location,
          commonColumns.currentCTC, // New column
          commonColumns.expectedCTC, // New column
          commonColumns.matchingScore,
          commonColumns.scoreDetails, // New column
          commonColumns.status,
          commonColumns.applicationDate, // New column
          commonColumns.cvViewedDate, // New column
          commonColumns.duplicateCV, // New column
          commonColumns.actions,
          commonColumns.response
        ];
      case "Hired":
        return [
          commonColumns.name,
          commonColumns.currentCompany,
          commonColumns.profile,
          commonColumns.experience,
          commonColumns.location,
          commonColumns.currentCTC,
          commonColumns.expectedCTC,
          commonColumns.matchingScore,
          commonColumns.scoreDetails,
          commonColumns.status,
          commonColumns.applicationDate,
          commonColumns.cvViewedDate,
          commonColumns.duplicateCV,
          commonColumns.actions,
          commonColumns.response
        ];
      case "Joined":
        return [
          { key: "name", label: "Candidate name" },
          { key: "ctc", label: "CTC" },
          { key: "designation", label: "Designation" },
          { key: "hiredBy", label: "Hired By" },
          { key: "joiningDate", label: "Joining Date" },
          {
            key: "actions",
            label: "Documents",
            render: () => (
              <div className="flex gap-2 justify-center">
                <button className="flex gap-2 items-center btn-sky">
                  <Eye size={16} />
                  View Document
                </button>
              </div>
            ),
          },
        ];
      default:
        return [];
    }
  };

  // Get columns for current tab
  const applicationColumns = getColumnsForTab(activeTab);

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
    return (
      <div className="grid grid-cols-3 gap-4">
        <div>
          <span className="font-semibold text-gray-500">About</span>
          <p>{row.applicantDetails.about ?? "------"}</p>
        </div>

        {row.status === "REJECTED" ? (
          // Show rejection details
          <>
            <div>
              <span className="font-semibold text-gray-500">Rejected by</span>
              <p>{row.rejectionAwsScheduleId ?? "--------"}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Reason</span>
              <p>{row.rejectionFeedbackBySystem}</p>
            </div>
          </>
        ) : (
          // Show application details
          <>
            <div>
              <span className="font-semibold text-gray-500">CTC</span>
              <p>{row.applicantDetails.CTC}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Notice</span>
              <p>{row.applicantDetails.noticePeriod}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Deselect button - only show when rows are selected */}
      <button className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${ListSelection.selectedRows.length === 0 ? "hidden" : ""}`} onClick={() => ListSelection.reset()}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
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
          onSubmit={() => {}}
          setIsAddEvaluatorModal={setIsAddEvaluatorModalOpen}
          setIsRejectModalOpen={(value) => setIsRejectModalOpen(value as { payload: JobApplicationUpdatePayloadDto; jobId: string } | null)}
          setIsHireNowModalOpen={setIsHireNowModalOpen}
          pdfuri={pdfViewDetails?.pdfUri ?? ""}
          mode={pdfViewDetails?.mode ?? "APPLIED"}
          misData={pdfViewDetails?.misData ?? { payload: { applicantName: "", emailId: "", status: "APPLIED", userId: "", userType: "" }, jobId: "" }}
        />
      </Modal>

      <Modal isOpen={isRejectModalOpen != null} onClose={() => setIsRejectModalOpen(null)} className="w-[90vw] sm:w-[455px] h-auto">
        {isRejectModalOpen && <RejectionForm payload={isRejectModalOpen.payload} jobId={isRejectModalOpen.jobId} />}
      </Modal>

      <Modal isOpen={isAddEvaluatorModalOpen} onClose={() => setIsAddEvaluatorModalOpen(false)} className="w-[90vw] sm:w-[455px] h-auto">
        {EvaluatorFormProps && <EvaluatorForm Defaultvalues={EvaluatorFormProps?.Defaultvalues} />}
      </Modal>

      <Modal isOpen={isHireNowModalOpen} onClose={() => setIsHireNowModalOpen(false)} className="w-[90vw] sm:w-[532px] h-full">
        <HireNowForm />
      </Modal>

      <Modal isOpen={isRequestDocModalOpen} onClose={() => setIsRequestDocModalOpen(false)} className="w-[90vw] sm:w-[455px] sm:h-[500px] h-[90vh]">
        <RequestDocumentModal />
      </Modal>

      <Modal isOpen={FeedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} className="h-full">
        {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
      </Modal>

      <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} className="w-full sm:max-w-4xl h-auto">
        <NotesApp />
      </Modal>
    </>
  );
}