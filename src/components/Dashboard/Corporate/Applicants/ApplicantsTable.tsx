import React, { useEffect, useState } from "react";
import { Eye, NotebookIcon, User } from "lucide-react";

// Component imports
import CVPreview from "./CVPreview";
import RejectionForm from "./RejectForm";
import EvaluatorForm from "./EvaluatorForm";
import HireNowForm from "./HireNowForm";
import ProgressCircle from "../../../Shared/CircularBar";
import RequestDocumentModal from "./RequestDocModal";
import InterviewFeedbackCard from "./InterviewFeedbackCard";
import Modal from "../Modal";
import { DynamicTable } from "../DynamicTable";
import Notes from "./Notes";

// Assets and interfaces
import { email, Not_Responding } from "@Assets";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { applcationType, JobApplicationUpdatePayloadDto } from "./Applicants";
import ScorePointsModal, { ScorePointsModalProps } from "@Components/Shared/DetailedAnalysis";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { CorporateUserDetail, useAppContext } from "@Context/App.context";

// Component props interface
interface ApplicationTableProps {
  activeTab: "All" | "Hired" | "Joined";
  setActiveTab: (tab: "All" | "Hired" | "Joined") => void;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  data: JobApplicationDetailsDto[];
  handleUpdate: (payload: JobApplicationUpdatePayloadDto, jobId: string) => void;
  userType: string;
}

export default function ApplicationTable({ activeTab, setActiveTab, selectedRows, setSelectedRows, data, handleUpdate, userType }: ApplicationTableProps) {
  // State management for expanded rows and modals
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<{
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  } | null>(null);
  const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
  const [isHireNowModalOpen, setIsHireNowModalOpen] = useState(false);
  const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState(false);
  const [FeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [scorePointsModal, setScorePointsModal] = useState<ScorePointsModalProps>();
  const { userDetails } = useAppContext() as { userDetails: CorporateUserDetail };
  const [pdfViewDetails, setPdfViewDetails] = useState<{
    pdfUri: string | undefined;
    mode: applcationType;
    misData: {
      payload: JobApplicationUpdatePayloadDto;
      jobId: string;
    };
  }>();

  // Common column definitions
  const commonColumns = {
    name: {
      key: "name",
      label: "Applicants name",
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
          <span>{row.applicantDetails?.candidateExperience.designation ?? "FRESHER"}</span>
        </div>
      ),
    },
    yoe: {
      key: "yoe",
      label: "YOE",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.applicantDetails.YOE ?? 0}</span>
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
    matchingScore: {
      key: "matchingScore",
      label: "Matching Score",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex justify-center">
          <ProgressCircle
            onClick={() => {
              setFeedbackModalOpen(true);

              setScorePointsModal({
                title: row.matchingScore ?? 0 >= 70 ? "Matching Score Details" : "Rejected Reason",
                data: row.matchingScore ?? 0 >= 70 ? row.scoreDetails : row.rejectionFeedbackBySystem, // Assuming matchingScore is an object with details
                matchingScore: row.matchingScore ?? 0,
                details: true,
                showCloseButton: true,
                onClose: () => setFeedbackModalOpen(false),
              });
              console.log("Matching Score Details:", scorePointsModal);
            }}
            value={row.matchingScore}
          />
        </div>
      ),
    },
    status: {
      key: "status",
      label: "Status",
      render: (row: JobApplicationDetailsDto) => {
        // Status color mapping
        const statusColors: Record<applcationType, string> = {
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
        const newDisplayStatus: Record<applcationType, string> = {
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

        const colorClass = statusColors[row.status as applcationType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>{newDisplayStatus[row.status as applcationType]}</span>
          </div>
        );
      },
    },
    actions: {
      key: "actions",
      label: "Actions",
      render: (row: JobApplicationDetailsDto) => {
        // Common action buttons
        const viewCvBtn = (
          <button
            title="View CV"
            onClick={() => {
              setIsViewCVModalOpen(true);
              setPdfViewDetails({
                pdfUri: row.applicantDetails.cvAwsS3SignedUrl,
                mode: row.status as applcationType,
                misData: {
                  payload: {
                    applicantName: row.applicantDetails.name,
                    emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
                    status: row.status as applcationType,
                    userId: userDetails ? userDetails?.id : "",
                    userType: userType,
                  },
                  jobId: row.id,
                },
              });
            }}
            className="flex gap-2 items-center btn-sky">
            <Eye size={16} />
            View CV
          </button>
        );

        const viewEvaluatorBtn = (
          <button title="View Evaluation" onClick={() => setIsAddEvaluatorModalOpen(true)} className="flex items-center gap-2 btn-sky">
            <Eye size={16} />
            View evaluation
          </button>
        );

        const hireNowBtn = (
          <button title="Hire Now" onClick={() => setIsHireNowModalOpen(true)} className="btn-sky flex gap-2 items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
              <path d="M15.75 8.34668V15.4717C15.75 16.093 15.2463 16.5967 14.625 16.5967H3.375C2.75368 16.5967 2.25 16.093 2.25 15.4717V4.22168C2.25 3.60036 2.75368 3.09668 3.375 3.09668H11.25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 8.34668L9.75 11.3467L15.375 3.47168" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
              <g clipPath="url(#clip0_742_200)">
                <path
                  d="M10.625 4.97168C10.625 4.67331 10.7435 4.38716 10.9545 4.17618C11.1655 3.96521 11.4516 3.84668 11.75 3.84668C12.0483 3.84668 12.3345 3.96521 12.5455 4.17618C12.7564 4.38716 12.875 4.67331 12.875 4.97168V9.09668M10.625 4.97168V3.47168C10.625 3.17331 10.5065 2.88716 10.2955 2.67618C10.0845 2.46521 9.79834 2.34668 9.49998 2.34668C9.20161 2.34668 8.91546 2.46521 8.70448 2.67618C8.4935 2.88716 8.37498 3.17331 8.37498 3.47168V4.59668M10.625 4.97168V8.34668M8.37498 4.59668C8.37498 4.29831 8.25645 4.01216 8.04547 3.80118C7.83449 3.59021 7.54834 3.47168 7.24998 3.47168C6.95161 3.47168 6.66546 3.59021 6.45448 3.80118C6.2435 4.01216 6.12498 4.29831 6.12498 4.59668V10.9432L4.90998 9.72443C4.78434 9.59824 4.63342 9.50006 4.46714 9.43634C4.30086 9.37262 4.12297 9.3448 3.94518 9.35472C3.76738 9.36464 3.5937 9.41206 3.43553 9.49388C3.27737 9.57569 3.1383 9.69005 3.02748 9.82943C2.85216 10.0493 2.75464 10.321 2.75016 10.6022C2.74568 10.8834 2.8345 11.1581 3.00273 11.3834L5.70273 14.8319C6.21948 15.4919 6.49998 16.5089 6.49998 17.3467M8.37498 4.59668V7.59668M15.125 9.09668V6.47168C15.125 6.17331 15.0065 5.88716 14.7955 5.67618C14.5845 5.46521 14.2983 5.34668 14 5.34668C13.7016 5.34668 13.4155 5.46521 13.2045 5.67618C12.9935 5.88716 12.875 6.17331 12.875 6.47168M11.75 15.4717C11.75 14.7704 11.75 14.4202 11.9007 14.1592C11.9995 13.9882 12.1415 13.8462 12.3125 13.7474C12.5735 13.5967 12.9237 13.5967 13.625 13.5967H14.375C15.0762 13.5967 15.4265 13.5967 15.6875 13.7474C15.8585 13.8462 16.0005 13.9882 16.0992 14.1592C16.25 14.4202 16.25 14.7704 16.25 15.4717C16.25 16.1729 16.25 16.5232 16.0992 16.7842C16.0005 16.9552 15.8585 17.0972 15.6875 17.1959C15.4265 17.3467 15.0762 17.3467 14.375 17.3467H13.625C12.9237 17.3467 12.5735 17.3467 12.3125 17.1959C12.1415 17.0972 11.9995 16.9552 11.9007 16.7842C11.75 16.5232 11.75 16.1729 11.75 15.4717ZM12.875 12.4717C12.875 12.1733 12.9935 11.8872 13.2045 11.6762C13.4155 11.4652 13.7016 11.3467 14 11.3467C14.2983 11.3467 14.5845 11.4652 14.7955 11.6762C15.0065 11.8872 15.125 12.1733 15.125 12.4717V13.5967H12.875V12.4717Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_742_200">
                  <rect width="18" height="18" fill="white" transform="translate(0.5 0.84668)" />
                </clipPath>
              </defs>
            </svg>
            on Hold
          </button>
        );

        const noteBtn = (
          <button title="Add Note" className="flex gap-2 items-center btn-sky" onClick={() => setIsNoteModalOpen(true)}>
            <NotebookIcon size={16} />
            Add Note
          </button>
        );

        // Return different actions based on tab and status
        if (activeTab === "All") {
          if (row.status === "APPLIED") {
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
          } else if (row.status === "CV_DOWNLOADED") {
            return (
              <div className="flex gap-2 justify-center">
                {viewCvBtn}
                <button title="Send to Evaluator" onClick={() => setIsAddEvaluatorModalOpen(true)} className="flex items-center gap-2 btn-sky">
                  <Eye size={16} />
                  Send to Evaluator
                </button>
              </div>
            );
          }

          const statusActions: applcationType[] = ["UNDER_EVALUATION", "PROCESSING_INTERVIEW", "HIRED"];
          if (statusActions.includes(row.status as applcationType)) {
            return (
              <div className="flex gap-2 justify-center">
                {viewCvBtn}
                {noteBtn}
                {/* {row.viewdCv && viewEvaluatorBtn} */}
                {viewEvaluatorBtn}
              </div>
            );
          } else {
            return <div className="flex gap-2 justify-center">---------</div>;
          }

          // Show rejection date for rejected applications
          return <span>{row.status === "rejected" ? row.updatedAt : undefined}</span>;
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
    currentCompany: {
      key: "company",
      label: "Current Company",
      render: (row: JobApplicationDetailsDto) => (
        <div className="flex items-center justify-center gap-2">
          <span>{row.companyName}</span>
        </div>
      ),
    },
  };

  /**
   * Get column configuration based on active tab
   */
  const getColumnsForTab = (tab: string): any[] => {
    switch (tab) {
      case "All":
        return [commonColumns.name, commonColumns.company, commonColumns.profile, commonColumns.yoe, commonColumns.location, commonColumns.matchingScore, commonColumns.status, commonColumns.actions, commonColumns.response];
      case "Hired":
        return [commonColumns.name, commonColumns.currentCompany, commonColumns.profile, commonColumns.yoe, commonColumns.location, commonColumns.matchingScore, commonColumns.status, commonColumns.actions, commonColumns.response];
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
   * Toggle select all rows
   */
  const toggleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row.id));
    }
  };

  /**
   * Toggle single row selection
   */
  const toggleRow = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

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
              <p>{row.rejectionAwsScheduleId ?? "--------"}</p> {/* @TODO- Add Updated By */}
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
    <div>
      {/* Deselect button - only show when rows are selected */}
      <button className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedRows.length === 0 ? "hidden" : ""}`} onClick={() => setSelectedRows([])}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
        <span>deselect {selectedRows.length} rows</span>
      </button>

      {/* Main table component */}
      <DynamicTable columns={applicationColumns} rows={data} selectedRows={selectedRows} expandedRows={expandedRows} toggleSelectAll={toggleSelectAll} toggleRow={toggleRow} toggleExpand={toggleExpand} allSelected={selectedRows.length === data.length} renderExpandedDetails={renderExpandedDetails} enableSelect={activeTab !== "Joined"} />

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
        <EvaluatorForm />
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
        <Notes />
      </Modal>
    </div>
  );
}
