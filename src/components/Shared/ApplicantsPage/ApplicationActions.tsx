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
  setIsNoteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  setJoinedModalOpen: React.Dispatch<React.SetStateAction<{ isOpen: boolean; jobApplication: JobApplicationDetailsDto; }>>
};

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
  } = props;

  /**
   * Action button definitions - Pure UI components with their handlers
   */
  const actionButtons: Record<JobApplicationActionType, React.ReactNode> = {
    ACCEPT: (
      <button
        key="accept"
        title="Accept"
        onClick={() => handleStatusUpdate("ACCEPTED", row)}
        className="btn-success">
        <Check size={16} />
      </button>
    ),

    REJECT: (
      <button
        key="reject"
        title="Reject"
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
        title="Initiate Hiring"
        onClick={() => handleStatusUpdate("HIRING_IN_PROCESS", row)}
        className="btn-hiring flex gap-2 items-center">
        <UserCheck size={16} />
      </button>
    ),

    HIRE_NOW: (
      <button
        key="hire-now"
        title="Hire Now"
        onClick={() => setIsHireNowModalOpen({ isOpen: true, jobData: row })}
        className="btn-hiring flex gap-2 items-center">
        <SquareCheckBig size={16} />
      </button>
    ),

    ONHOLD: (
      <button
        key="hold"
        title="Hold"
        className="flex gap-2 items-center btn-warning"
        onClick={() => handleStatusUpdate("ON_HOLD", row)}>
        <Pause size={16} />
      </button>
    ),

    VIEW_CV: (
      <button
        key="view-cv"
        title="View CV"
        onClick={() => {
          setPdfViewDetails(row.id);
          setIsViewCVModalOpen(true);
          if (row.status === "ACCEPTED") {
            handleStatusUpdate("CV_DOWNLOADED", row,false );
          }
        }}
        className="flex gap-2 items-center btn-info">
        <Eye size={16} />
      </button>
    ),

    NOTES: (
      <button
        key="notes"
        title="Notes"
        className="flex gap-2 items-center btn-info"
        onClick={() => setIsNoteModalOpen(true)}>
        <NotebookIcon size={16} />
      </button>
    ),

    VIEW_EVALUATION: (
      <button
        key="view-eval"
        title="View Evaluation"
        onClick={() => setViewEvaluation({ isOpen: true, jobApplicationData: row })}
        className="flex items-center gap-2 btn-info">
        <FileCheck2 size={16} />
      </button>
    ),

    SEND_TO_EVALUATOR: (
      <button
        key="send-eval"
        title="Send to Evaluator"
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
        title="Process Interview"
        onClick={() => handleStatusUpdate("PROCESSING_INTERVIEW", row)}
        className="btn-process flex gap-2 items-center">
        <Clipboard className="w-4 h-4" />
      </button>
    ),

    INTERVIEW_DONE: (
      <button
        key="interview-done"
        title="Interview Done"
        onClick={() => handleStatusUpdate("INTERVIEW_DONE", row)}
        className="btn-process flex gap-2 items-center">
        <ClipboardCheck className="w-4 h-4" />
      </button>
    ),

    REQUEST_DOCUMENT: (
      <button
        key="req-doc"
        title="Request Document"
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
      <div
        key="mark-dup"
        onClick={() => handleMarkAsDuplicateJob("EDIT")}
        className="btn-outline cursor-pointer w-fit h-11 pl-3.5 pr-4 py-2 inline-flex justify-center items-center gap-0.5">
        <Flag size={16} />
      </div>
    ),

    VIEW_DUPLICACY: (
      <div
        key="view-dup"
        onClick={() => handleMarkAsDuplicateJob("VIEW")}
        className="btn-outline cursor-pointer w-fit h-11 pl-3.5 pr-4 py-2 inline-flex justify-center items-center gap-0.5">
        <Eye size={16} />
      </div>
    ),

    PUSH_TO_RECRUITER: (
      <button
        key="push-recruiter"
        title={row.displayToCorporate ? "Already sent to recruiter" : "Send to Recruiter"}
        onClick={() =>
          !row.displayToCorporate &&
          sendApplicationToRecruiter &&
          sendApplicationToRecruiter(row.id)
        }
        disabled={row.displayToCorporate}
        className={`flex gap-2 items-center bg-green-600 text-white p-2 rounded-xl ${
          row.displayToCorporate ? "btn-gray cursor-not-allowed opacity-60" : "btn-sky"
        }`}>
        <Forward size={16} />
      </button>
    ),

    VIEW_DOCUMENT: (
      <button
        className="btn-info"
        key="view-doc"
        title="View Document"
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
        <FileText size={16} />
      </button>
    ),

    VIEW_OFFER_LETTER_ISSUE: (
      <button
        className="btn-warning"
        key="view-issues"
        title="View Issues"
        onClick={() => setIsViewOfferIssue({ isOpen: true, jobData: row })}>
        <AlertTriangle size={16} />
      </button>
    ),

    JOINED: (
      <button
        key="joined"
        title="Joined"
        onClick={() => setJoinedModalOpen({isOpen:true, jobApplication:row})}
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
      "VIEW_OFFER_LETTER_ISSUE",
      "JOINED", // Other actions
      "REJECT",
      "ONHOLD", // Secondary actions
      "NOTES",
    ];

    actionPriority.forEach((action) => {
      if (shouldShowAction(action, row, activeTab)) {
        // console.log(`Action ${action} is visible for status ${row.status} and tab ${activeTab}`);
        const button = actionButtons[action];
        if (button) {
          visibleActions.push(button);
        }
      }
    });

    return visibleActions;
  };

  const visibleActions = getVisibleActions();

  if (visibleActions.length === 0) {
    return null;
  }

  return <div className="flex gap-2 justify-center">{visibleActions}</div>;
};
