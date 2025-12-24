// components/JobApplicationActions.tsx
import React from "react";
import {
  Clipboard,
  ClipboardCheck,
  Eye,
  Flag,
  NotebookIcon,
  Plane,
  Check,
  X,
  UserCheck,
  Pause,
  FileText,
  Send,
  Users,
  Calendar,
  FileCheck,
  AlertTriangle,
  Download,
  UserPlus,
  Award,
  FileCheck2,
  SquareCheckBig,
  Forward,
  Fingerprint,
  FileStack,
  HelpingHand,
  LucideFileCheck2,
  ClipboardEditIcon,
} from "lucide-react";
import { CompanyDetails, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationUpdatePayloadDto } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { EvaluatorFormProps } from "./EvaluatorForm";
import { hireNow, onHold } from "@AssetsFolder/assets";
import {
  JobApplicationActionType,
  shouldShowAction,
  TabType,
} from "@Utils/ApplicationButtonVisibility.utils";
import { RequestDocModalProps } from "./RequestDocModal";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";

type Props = {
  row: JobApplicationDetailsDto;
  activeTab: TabType;
  userDetails: NormalizedUser;
  userType: any;
  isBulkEvaluation?: boolean;
  // ... all your existing props
  setPdfViewDetails: React.Dispatch<React.SetStateAction<string | null>>;
  setViewEvaluation: React.Dispatch<React.SetStateAction<any>>;
  setIsHireNowModalOpen: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      jobData: JobApplicationDetailsDto;
    }>
  >;
  setIsViewOfferIssue: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      jobData: JobApplicationDetailsDto;
    }>
  >;
  setIsNoteModalOpen: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      jobApplication: JobApplicationDetailsDto | null;
    }>
  >;
  setIsRejectModalOpen: React.Dispatch<React.SetStateAction<any>>;
  setIsAddEvaluatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEvaluatorFormProps: React.Dispatch<React.SetStateAction<EvaluatorFormProps | null>>;
  setIsRequestDocModalOpen: React.Dispatch<React.SetStateAction<RequestDocModalProps>>;
  sendApplicationToRecruiter?: (applicationId: string) => void;
  setIsViewCVModalOpen: (v: boolean) => void;
  handleStatusUpdate: (
    status: JobApplicationStatusType,
    row: JobApplicationDetailsDto,
    notify?: boolean
  ) => void;
  handleMarkAsDuplicateJob: (action: "EDIT" | "VIEW") => void;
  setJoinedModalOpen: React.Dispatch<
    React.SetStateAction<{ isOpen: boolean; jobApplication: JobApplicationDetailsDto }>
  >;
  splitMode?: "main" | "expanded" | "all"; // NEW
};
// ============================================
// 1. Define split configuration in a constant
// ============================================
export const ACTION_SPLIT_CONFIG = {
  // Always keep these in main row (max 2-3 for best UX)
  mainRowActions: ["VIEW_CV", "NOTES"] as const,

  // Rest go to expanded section
  // Leave empty to auto-calculate
  expandedActions: [] as const,
} as const;

export const JobApplicationActions: React.FC<Props> = (props) => {
  const {
    row,
    activeTab,
    userDetails,
    userType,
    isBulkEvaluation,
    handleStatusUpdate,
    setIsViewCVModalOpen,
    setPdfViewDetails,
    setViewEvaluation,
    setIsHireNowModalOpen,
    setIsViewOfferIssue,
    setIsNoteModalOpen,
    setIsRejectModalOpen,
    setIsAddEvaluatorModalOpen,
    setEvaluatorFormProps,
    setIsRequestDocModalOpen,
    handleMarkAsDuplicateJob,
    sendApplicationToRecruiter,
    setJoinedModalOpen,
    splitMode = "all",
  } = props;

  /**
   * Handler for Accept action - specific logic can be added here
   */
  const handleAcceptForAdmin = (row: JobApplicationDetailsDto) => {
    // Example logic: Directly update status to ACCEPTED for admin users
    if (RBAC.can("play_admin")) {
      handleStatusUpdate("ACCEPTED", row);
      !row.displayToCorporate && sendApplicationToRecruiter && sendApplicationToRecruiter?.(row.id);
    } else {
      handleStatusUpdate("ACCEPTED", row);
    }
  };

  /**
   * Action button definitions - Pure UI components with their handlers
   */
  const actionButtons: Record<JobApplicationActionType, React.ReactNode> = {
    ACCEPT: (
      <button
        key="accept"
        Data-tooltip-id="my-tooltip"
        Data-tooltip-content="Accept Application"
        onClick={() => handleAcceptForAdmin(row)}
        className="btn-success">
        <Check size={16} />
      </button>
    ),

    REJECT: (
      <button
        key="reject"
        Data-tooltip-id="my-tooltip"
        Data-tooltip-content="Reject Application"
        onClick={() => {
          const payload: JobApplicationUpdatePayloadDto = {
            applicantName: row.applicantDetails.name,
            emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
            status: "REJECTED",
            userId: userDetails ? userDetails.id : "",
            userType: userType,
          };
          setIsRejectModalOpen({ payload, jobId: row.id });
        }}
        className="btn-danger">
        <X size={16} />
      </button>
    ),

    HIRE: (
      <button
        key="hire"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Initiate Hiring"
        onClick={() => handleStatusUpdate("HIRING_IN_PROCESS", row)}
        className="btn-hiring flex gap-2 items-center">
        <UserCheck size={16} />
      </button>
    ),

    HIRE_NOW: (
      <button
        key="hire-now"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Hire Now"
        onClick={() => setIsHireNowModalOpen({ isOpen: true, jobData: row })}
        className="btn-hiring flex gap-2 items-center">
        <SquareCheckBig size={16} />
      </button>
    ),

    ONHOLD: (
      <button
        key="hold"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Hold Application"
        className="flex gap-2 items-center btn-warning"
        onClick={() => handleStatusUpdate("ON_HOLD", row)}>
        <Pause size={16} />
      </button>
    ),
    VIEW_CV: (
      <button
        key="view-cv"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View CV"
        onClick={() => {
          setPdfViewDetails(row.id);
          setIsViewCVModalOpen(true);
          if (row.status === "ACCEPTED") {
            handleStatusUpdate("CV_DOWNLOADED", row, false);
          }
        }}
        className="flex gap-2 items-center btn-info">
        <Eye size={16} />
      </button>
    ),

    NOTES: (
      <button
        key="notes"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Add/View Notes"
        className="flex gap-2 items-center btn-info"
        onClick={() =>
          setIsNoteModalOpen({
            isOpen: true,
            jobApplication: row,
          })
        }>
        <NotebookIcon size={16} />
      </button>
    ),

    VIEW_EVALUATION: (
      <button
        key="view-eval"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View Evaluation"
        onClick={() => setViewEvaluation({ isOpen: true, jobApplicationData: row })}
        className="flex items-center gap-2 btn-info">
        <FileCheck2 size={16} />
      </button>
    ),

    SEND_TO_EVALUATOR: (
      <button
        key="send-eval"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Send to Evaluator"
        onClick={() => {
          const companyDetails: CompanyDetails | null = secureStorage.getItem(
            SecureStorageKeyEnum.CORPORATECOMPANYDERAILS
          );

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
              hrCurrentCompanyName: RBAC.can("play_admin") ? "WORKO" : companyDetails?.name || "",
              cvAwsS3ResourceType: [row.applicantDetails.cvAwsS3ResourceType],
              candidateParsedCvId: [row?.candidateParsedCvId || ""],
            },
            isBulk: isBulkEvaluation || false,
            onClose: () => setIsAddEvaluatorModalOpen(false),
            formLimit: 10, // Assuming a default limit of 10 evaluators
          });
        }}
        className="flex items-center gap-2 btn-process">
        <Send size={16} />
      </button>
    ),

    PROCESS_INTERVIEW: (
      <button
        key="process-interview"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Process Interview"
        onClick={() => handleStatusUpdate("PROCESSING_INTERVIEW", row)}
        className="btn-process flex gap-2 items-center">
        <Clipboard className="w-4 h-4" />
      </button>
    ),

    INTERVIEW_DONE: (
      <button
        key="interview-done"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Interview Done"
        onClick={() => handleStatusUpdate("INTERVIEW_DONE", row)}
        className="btn-process flex gap-2 items-center">
        <ClipboardCheck className="w-4 h-4" />
      </button>
    ),

    REQUEST_DOCUMENT: (
      <button
        key="req-doc"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Request Document"
        onClick={() =>
          setIsRequestDocModalOpen({
            isOpen: true,
            jobApplication: row,
            mode: "REQUEST",
            onClose: () =>
              setIsRequestDocModalOpen({
                isOpen: false,
                jobApplication: {} as JobApplicationDetailsDto,
                mode: "REQUEST",
                onClose: () => {},
              }),
          })
        }
        className="flex items-center gap-2 btn-neutral bg-indigo-500">
        <FileStack size={16} />
      </button>
    ),

    MARK_DUPLICATE: (
      <button
        disabled={!row?.hiredFromOtherPortal?.portal || !row?.hiredFromOtherPortal?.date}
        key="mark-dup"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Mark as Duplicate"
        onClick={() => handleMarkAsDuplicateJob("EDIT")}
        className={`btn-outline btn_disabled ${
          row?.hiredFromOtherPortal && row?.hiredFromOtherPortal?.portal === "exist"
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}>
        <Flag size={16} />
      </button>
    ),

    VIEW_DUPLICACY: (
      <div
        key="view-dup"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View Duplicacy"
        onClick={() => handleMarkAsDuplicateJob("VIEW")}
        className="btn-outline cursor-pointer ">
        <Eye size={16} />
      </div>
    ),

    PUSH_TO_RECRUITER: (
      <button
        disabled={jobApplicationServiceObj.showPushToRecruiterButton(row) === false}
        key="push-recruiter"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Push to Recruiter"
        onClick={() =>
          !row.displayToCorporate &&
          sendApplicationToRecruiter &&
          sendApplicationToRecruiter(row.id)
        }
        className={`btn_disabled flex gap-2 items-center bg-green-600 text-white p-2 rounded-xl ${
          row.displayToCorporate ? "btn-gray cursor-not-allowed opacity-60" : "btn-sky"
        }`}>
        <Forward size={16} />
      </button>
    ),

    VIEW_DOCUMENT: (
      <button
        className="btn-info bg-orange-500
        hover:bg-orange-600
        "
        key="view-doc"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Request Document & Verify."
        onClick={() =>
          setIsRequestDocModalOpen({
            isOpen: true,
            jobApplication: row,
            mode: "VIEW",
            onClose: () =>
              setIsRequestDocModalOpen({
                isOpen: false,
                jobApplication: {} as JobApplicationDetailsDto,
                mode: "REQUEST",
                onClose: () => {},
              }),
          })
        }>
        <ClipboardEditIcon size={16} />
      </button>
    ),
    VIEW_DOCUMENT_READ: (
      <button
        className="btn-info-2"
        key="view-doc-read"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View All Document (Read Only)"
        onClick={() =>
          setIsRequestDocModalOpen({
            isOpen: true,
            jobApplication: row,
            mode: "READ_ONLY",
            onClose: () =>
              setIsRequestDocModalOpen({
                isOpen: false,
                jobApplication: {} as JobApplicationDetailsDto,
                mode: "READ_ONLY",
                onClose: () => {},
              }),
          })
        }>
        <LucideFileCheck2 size={16} />
      </button>
    ),

    VIEW_OFFER_LETTER_ISSUE: (
      <button
        className="btn-warning"
        key="view-issues"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="View Offer Letter Issues"
        onClick={() => setIsViewOfferIssue({ isOpen: true, jobData: row })}>
        <AlertTriangle size={16} />
      </button>
    ),

    JOINED: (
      <button
        key="joined"
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Mark as Joined"
        onClick={() => setJoinedModalOpen({ isOpen: true, jobApplication: row })}
        className="btn-success flex gap-2 items-center">
        <Award size={16} />
      </button>
    ),
  };

  /**
   * Get all visible actions for current status and tab
   */
  const getVisibleActions = (): React.ReactNode[] => {
    const visibleActions: React.ReactNode[] = [];

    // Define the priority order of actions
    const actionPriority: JobApplicationActionType[] = [
      "PUSH_TO_RECRUITER", // Primary actions
      "VIEW_CV",
      "ACCEPT",
      "MARK_DUPLICATE",
      "VIEW_DUPLICACY", // Duplicate handling
      "SEND_TO_EVALUATOR",
      "VIEW_EVALUATION", // CV and evaluation
      "PROCESS_INTERVIEW",
      "INTERVIEW_DONE", // Interview actions
      "HIRE",
      "HIRE_NOW",
      "REQUEST_DOCUMENT", // Hiring actions
      "VIEW_DOCUMENT",
      "VIEW_DOCUMENT_READ",
      "VIEW_OFFER_LETTER_ISSUE",
      "JOINED", // Other actions
      "REJECT",
      "ONHOLD", // Secondary actions
      "NOTES",
    ];
    const allVisibleActions: React.ReactNode[] = [];

    actionPriority.forEach((action) => {
      if (shouldShowAction(action, row, activeTab)) {
        const button = actionButtons[action];
        if (button) allVisibleActions.push(button);
      }
    });

    // If not splitting, return all
    if (splitMode === "all") return allVisibleActions;

    // Split logic
    const mainRowKeys = ACTION_SPLIT_CONFIG.mainRowActions;
    const mainActions: React.ReactNode[] = [];
    const expandedActions: React.ReactNode[] = [];

    actionPriority.forEach((action) => {
      if (shouldShowAction(action, row, activeTab)) {
        const button = actionButtons[action];
        if (!button) return;

        if (mainRowKeys.includes(action as any)) {
          mainActions.push(button);
        } else {
          expandedActions.push(button);
        }
      }
    });

    return splitMode === "main" ? mainActions : expandedActions;
  };

  const visibleActions = getVisibleActions();

  if (visibleActions.length === 0) {
    return null;
  }
// For expanded mode: Use flex-wrap for compact, multi-row layout
if (splitMode === "expanded") {
  return (
    <div className="absolute left-0 right-0 -top-4 mx-auto max-w-[80px] flex flex-wrap gap-2 justify-center items-start ">
      {visibleActions}
    </div>
  );
}

// For main row or all mode: Use single row layout
return (
  <div className="flex gap-2 justify-center items-center h-fit py-1">
    {visibleActions}
  </div>
);
};
