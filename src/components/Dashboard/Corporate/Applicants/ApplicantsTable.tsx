import React, { useState } from "react";
import { Eye, NotebookIcon, User } from "lucide-react";

// Component imports
import CVPreview from "@Components/Shared/ApplicantsPage/CVPreview";
import RejectionForm from "../../../Shared/ApplicantsPage/RejectForm";
import EvaluatorForm, { EvaluatorFormProps } from "../../../Shared/ApplicantsPage/EvaluatorForm";
import HireNowForm from "../../../Shared/ApplicantsPage/HireNowForm";
import ProgressCircle from "../../../Shared/CircularBar";
import RequestDocumentModal, {
  RequestDocModalProps,
} from "../../../Shared/ApplicantsPage/RequestDocModal";
import Modal from "../../../Shared/Modal";
import { DynamicTable } from "../../../Shared/DynamicTable";

// Assets and interfaces
import { email, hireNow, Not_Responding, onHold } from "@Assets";
import { CompanyDetails, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { ApplicationListSelectionDto, JobApplicationUpdatePayloadDto } from "./Applicants";
import ScorePointsModal, { ScorePointsModalProps } from "@Components/Shared/DetailedAnalysis";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { CommonCursorPaginationProp } from "src/types/interface/CorporateServices.dto";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { NormalizedUser } from "@Utils/NormalizeUser";
import NotesApp from "@Components/Shared/ApplicantsPage/Notes";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import ResponseEvaluation from "@Components/Shared/ApplicantsPage/ViewEvaluation";
import { JobApplicationActions } from "@Components/Shared/ApplicantsPage/ApplicationActions";
import Duplicacy from "@Components/Shared/ApplicantsPage/Duplicacy";
import { Job } from "aws-sdk/clients/codepipeline";
import ResendOfferLetter, { getLatestOfferLetterIssueRaisedDetails, handleViewDocumentClick } from "@Components/Shared/ApplicantsPage/ReSendOfferLetter";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import { JoinedModal } from "@Components/Shared/ApplicantsPage/JoinedModal";
import Timeline, { TimelineStep } from "@Components/Shared/Timeline";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

// Component props interface

export const statusColors: Record<JobApplicationStatusType, string> = {
  APPLIED: "bg-[#D6F4FF] text-[#00ADC0]",
  ACCEPTED: "bg-[#00ADC0] text-[#D6F4FF]",
  REJECTED: "bg-[#FFD0D0] text-[#D40000]",
  UNDER_EVALUATION: "bg-[#EFEFEF] text-[#616161]",
  PROCESSING_INTERVIEW: "bg-green-100 text-green-500",
  HIRED: "bg-[#4CBC9A38] text-[#00BF29]",
  CV_DOWNLOADED: "bg-[#00ADC0] text-[#D6F4FF]",
  INTERVIEW_DONE: "bg-[#E3F7F7] text-[#008B8B]",
  ALL: "bg-[#E6E4FF] text-[#5C55D4]",
  ON_HOLD: "bg-[#FFF3CD] text-[#856404]",
  JOINED: "bg-[#D1E7DD] text-[#0F5132]",
  DOCUMENT_REQUESTED: "bg-[#D6F4FF] text-[#00ADC0]",
  DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED: "bg-[#D6F4FF] text-[#00ADC0] has-notification",
  DOCUMENT_REVISION_REQUEST_SUBMITTED: "bg-[#D6F4FF] text-[#00ADC0] has-notification",
  DOCUMENT_REVISION_REQUESTED: "bg-[#D6F4FF] text-[#00ADC0] has-notification",
  DOCUMENT_SUBMITTED: "bg-[#D6F4FF] text-[#00ADC0] has-notification",
  DOCUMENT_VERIFIED: "bg-[#D6F4FF] text-[#00ADC0]",
  OFFER_SENT: "bg-[#D6F4FF] text-[#00ADC0]",
  HIRING_IN_PROCESS: "bg-[#D6F4FF] text-[#00ADC0]",
  DOCUMENT_ADDITIONAL_REQUESTED: "bg-[#D6F4FF] text-[#00ADC0]",
  OFFER_ISSUE_RAISED: "bg-[#FFD700] text-[#856404]",
  REVISED_OFFER_SENT: "bg-[#D6F4FF] text-[#00ADC0]",
};
export const newDisplayStatus: Record<JobApplicationStatusType, string> = {
  // All Status that will be displayed in the table
  ALL: "All",
  APPLIED: "Pending",
  ACCEPTED: "Accepted",
  CV_DOWNLOADED: "Accepted",
  UNDER_EVALUATION: "Evaluation Pending",
  PROCESSING_INTERVIEW: "Interviewing",
  INTERVIEW_DONE: "Interview Done",

  //HIRED
  HIRING_IN_PROCESS: "Hiring in Process",
  DOCUMENT_REQUESTED: "Document Requested",
  DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED: "Document Requested",
  DOCUMENT_REVISION_REQUEST_SUBMITTED: "Document Requested",
  DOCUMENT_REVISION_REQUESTED: "Document Requested",
  DOCUMENT_SUBMITTED: "Document Requested",
  DOCUMENT_VERIFIED: "Document Verified",
  HIRED: "Hired",
  OFFER_SENT: "Offer Sent",

  // JOINED
  JOINED: "Joined",
  ON_HOLD: "On Hold",
  REJECTED: "Rejected",

  // Additional statuses
  DOCUMENT_ADDITIONAL_REQUESTED: "Document Requested",
  OFFER_ISSUE_RAISED: "Offer Issue Raised",
  REVISED_OFFER_SENT: "Revised Offer Sent",
};
export interface ApplicationTableProps {
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
  Pagination: CommonCursorPaginationProp;
  isAddEvaluatorModalOpen: boolean;
  setIsAddEvaluatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  EvaluatorFormProps: EvaluatorFormProps | null;
  setEvaluatorFormProps: React.Dispatch<React.SetStateAction<EvaluatorFormProps | null>>;
  isBulkEvaluation: boolean; // Optional prop to indicate if it's a bulk evaluation
  onBulkUpdate: (JobApplicationStatusType: JobApplicationStatusType) => void; // Optional prop for bulk update functionality
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
  isBulkEvaluation,
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
  const [joinedModalOpen, setJoinedModalOpen] = useState({
    isOpen: false,
    jobApplication: {} as JobApplicationDetailsDto,
  });
  const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState<RequestDocModalProps>({
    isOpen: false,
    jobApplication: {} as JobApplicationDetailsDto,
    mode: "VIEW",
    onClose: () => setIsRequestDocModalOpen({ ...isRequestDocModalOpen, isOpen: false }),
  });
  const [FeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [evaluatorFormCount, setEvaluatorFormCount] = useState(10);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [scorePointsModal, setScorePointsModal] = useState<ScorePointsModalProps>();
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({
    isOpen: false,
    applicant: {} as JobApplicationDetailsDto,
    action: "EDIT" as "EDIT" | "VIEW",
  });
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);

  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    matchingScore: [
      "matchingScore",
      "scoreDetails.matchingScore",
      "scoreDetails.matchingScorePercentage",
    ],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);

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
    status: {
      key: "status",
      label: "Status",
      render: (row: JobApplicationDetailsDto) => {
        // Status color mapping

        const colorClass =
          statusColors[row.status as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";

        return (
          <div className="flex justify-center relative">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
              {newDisplayStatus[row.status as JobApplicationStatusType]}
            </span>
          </div>
        );
      },
    },
    actions: {
      key: "actions",
      label: "Actions",
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
    company: {
      key: "company",
      label: "Current Company",
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
        return [
          commonColumns.name,
          commonColumns.company,
          commonColumns.profile,
          commonColumns.yoe,
          commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.status,
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Hired":
        return [
          commonColumns.name,
          commonColumns.currentCompany,
          commonColumns.profile,
          commonColumns.yoe,
          commonColumns.location,
          commonColumns.matchingScore,
          commonColumns.status,
          commonColumns.actions,
          commonColumns.response,
        ];
      case "Joined":
        return [
          commonColumns.name,
          { key: "applicantDetails_CTC", label: "CTC" },
          { key: "applicantDetails_candidateExperience_designation", label: "Designation" },
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
          {
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
        <>
          <div className="basis-2/3">
            <span className="font-semibold text-gray-500 ">About</span>
            <p>{row.applicantDetails.about ?? "--------"}</p>
          </div>

          {row.status === "REJECTED" ? (
            // Show rejection details
            <>
              <div>
                <span className="font-semibold text-gray-500">Rejected by</span>
                <p>{row.rejectedByUserId?.userType ?? "--------"}</p>
              </div>

              <div className="text-center">
                <div className="font-semibold text-gray-500 text-center">Reason</div>

                {row.rejectedByUserId ? (
                  <>
                    <li className="list-disc list-inside">{row.rejectedByUserId.reason}</li>
                    {row.rejectedByUserId.userComment && (
                      <div>
                        <ul>
                          <span className="font-semibold text-gray-500">Comment</span>
                        </ul>
                        <li className="list-disc list-inside ">
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
        </>
        {row.status === "JOINED" && <Timeline steps={timeLineProps} />}
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
        <RequestDocumentModal {...isRequestDocModalOpen} handleStatusUpdate={handleStatusUpdate} />
      </Modal>

      <Modal
        isOpen={FeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        className="py-5">
        {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
      </Modal>

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        className="w-full sm:max-w-4xl h-auto">
        <NotesApp />
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
            const companyDetails: CompanyDetails | null = secureStorage.getItem<CompanyDetails>(
              SecureStorageKeyEnum.CORPORATECOMPANYDERAILS
            );
            const applicantData = sortedData.find((row) => row.id === JobApplicationId);
            /* console.log("Applicant Data:", applicantData); */
            if (applicantData && companyDetails) {
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
                  hrCurrentCompanyName: companyDetails?.name || "",
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
        <Duplicacy action={duplicateModalOpen.action} applicant={duplicateModalOpen.applicant} />
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
