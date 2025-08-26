// components/JobApplicationActions.tsx
import React from "react";
import { Clipboard, ClipboardCheck, Eye, Flag, NotebookIcon, Plane, Check, X, UserCheck, Pause, FileText, Send, Users, Calendar, FileCheck, AlertTriangle, Download } from "lucide-react"; //_CS Added more icons for better button representation
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationUpdatePayloadDto } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { EvaluatorFormProps } from "./EvaluatorForm";
import { hireNow, onHold } from "@AssetsFolder/assets";
import { JobApplicationActionType, shouldShowAction, TabType } from "@Utils/ApplicationButtonVisibility.utils";
import { RequestDocModalProps } from "./RequestDocModal";

type Props = {
  row: JobApplicationDetailsDto;
  activeTab: TabType;
  userDetails: NormalizedUser;
  userType: any;
  isBulkEvaluation?: boolean;
  // ... all your existing props
  setPdfViewDetails: React.Dispatch<React.SetStateAction<string | null>>;
  setViewEvaluation: React.Dispatch<React.SetStateAction<any>>;
  setIsHireNowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNoteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRejectModalOpen: React.Dispatch<React.SetStateAction<any>>;
  setIsAddEvaluatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEvaluatorFormProps: React.Dispatch<React.SetStateAction<EvaluatorFormProps | null>>;
  setIsRequestDocModalOpen: React.Dispatch<
    React.SetStateAction<RequestDocModalProps>
  >;
  secureStorage: any;
  SecureStorageKeyEnum: any;
  handleStatusUpdate: (status: JobApplicationStatusType, row: JobApplicationDetailsDto, notify?: boolean) => void;
  setIsViewCVModalOpen: (v: boolean) => void;
  handleMarkAsDuplicateJob: (action: "EDIT" | "VIEW") => void;
};

export const JobApplicationActions: React.FC<Props> = (props) => {
  const { row, activeTab, userDetails, userType, isBulkEvaluation, handleStatusUpdate, setIsViewCVModalOpen, setPdfViewDetails, setViewEvaluation, setIsHireNowModalOpen, setIsNoteModalOpen, setIsRejectModalOpen, setIsAddEvaluatorModalOpen, setEvaluatorFormProps, setIsRequestDocModalOpen, secureStorage, SecureStorageKeyEnum, handleMarkAsDuplicateJob } = props;

  /**
   * Action button definitions - Pure UI components with their handlers
   */
  const actionButtons: Record<JobApplicationActionType, React.ReactNode> = {
    ACCEPT: (
      <button key="accept" title="Accept" onClick={() => handleStatusUpdate("ACCEPTED", row)} className="bg-emerald-400 hover:bg-emerald-500 px-2 py-2 rounded-[10px] text-white">
        <Check size={16} /> {/*_CS Added Check icon instead of text */}
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
        className="bg-red-500 hover:bg-red-600 p-2 py-2 rounded-[10px] text-white">
        <X size={16} /> {/*_CS Added X icon instead of text */}
      </button>
    ),

    HIRE: (
      <button key="hire" title="Initiate Hiring" onClick={() => handleStatusUpdate("HIRING_IN_PROCESS", row)} className="btn-sky !bg-green-500 flex gap-2 items-center">
        <UserCheck size={16} /> {/*_CS Added UserCheck icon instead of image and text */}
      </button>
    ),

    HIRE_NOW: (
      <button key="hire-now" title="Hire Now" onClick={() => setIsHireNowModalOpen(true)} className="btn-sky flex gap-2 items-center">
        <UserCheck size={16} /> {/*_CS Added UserCheck icon instead of image and text */}
      </button>
    ),

    ONHOLD: (
      <button key="hold" title="Hold" className="flex gap-2 items-center btn-blue" onClick={() => handleStatusUpdate("ON_HOLD", row)}>
        <Pause size={16} /> {/*_CS Added Pause icon instead of image and text */}
      </button>
    ),

    //_CS Removed "View Cv" text, kept Eye icon
    VIEW_CV: (
      <button
        key="view-cv"
        title="View CV"
        onClick={() => {
          setPdfViewDetails(row.id);
          setIsViewCVModalOpen(true);
          if (row.status === "ACCEPTED") {
            handleStatusUpdate("CV_DOWNLOADED", row, false);
          }
        }}
        className="flex gap-2 items-center btn-sky">
        <Eye size={16} />
      </button>
    ),

    //_CS Removed "Notes" text, kept NotebookIcon
    NOTES: (
      <button key="notes" title="Notes" className="flex gap-2 items-center btn-sky" onClick={() => setIsNoteModalOpen(true)}>
        <NotebookIcon size={16} />
      </button>
    ),

    VIEW_EVALUATION: (
      <button key="view-eval" title="View Evaluation" onClick={() => setViewEvaluation({ isOpen: true, jobApplicationData: row })} className="flex items-center gap-2 btn-sky">
        <FileText size={16} /> {/*_CS Added FileText icon instead of Eye icon and removed text */}
      </button>
    ),

    SEND_TO_EVALUATOR: (
      <button
        key="send-eval"
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
            isBulk: isBulkEvaluation || false,
            onClose: () => setIsAddEvaluatorModalOpen(false),
            formLimit: 10, // Assuming a default limit of 10 evaluators
          });
        }}
        className="flex items-center gap-2 btn-sky">
        <Send size={16} /> {/*_CS Added Send icon instead of Eye icon and removed text */}
      </button>
    ),

    //_CS Removed "Process Interview" text, kept Clipboard icon
    PROCESS_INTERVIEW: (
      <button key="process-interview" title="Process Interview" onClick={() => handleStatusUpdate("PROCESSING_INTERVIEW", row)} className="btn-sky flex gap-2 items-center">
        <Clipboard className="w-4 h-4" />
      </button>
    ),

    //_CS Removed "Interview Done" text, kept ClipboardCheck icon
    INTERVIEW_DONE: (
      <button key="interview-done" title="Interview Done" onClick={() => handleStatusUpdate("INTERVIEW_DONE", row)} className="btn-sky flex gap-2 items-center">
        <ClipboardCheck className="w-4 h-4" />
      </button>
    ),

    REQUEST_DOCUMENT: (
      <button key="req-doc" title="Request Document" onClick={() => setIsRequestDocModalOpen(
        { isOpen: true, jobApplication: row, mode: 'REQUEST', onClose: () => setIsRequestDocModalOpen({ isOpen: false, jobApplication: {} as JobApplicationDetailsDto, mode: 'REQUEST', onClose: () => {} }) }
      )} className="flex items-center gap-2 btn-dark">
        <Download size={16} /> {/*_CS Added Download icon instead of Eye icon and removed text */}
      </button>
    ),

    //_CS Removed "Mark as Duplicate" text, kept Flag icon
    MARK_DUPLICATE: (
      <div key="mark-dup" onClick={() => handleMarkAsDuplicateJob("EDIT")} className="cursor-pointer w-fit h-11 pl-3.5 pr-4 py-2 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-blue-600 inline-flex justify-center items-center gap-0.5">
        <Flag size={16} className="text-blue-600" />
      </div>
    ),

    //_CS Removed "View Duplicacy" text, kept Flag icon
    VIEW_DUPLICACY: (
      <div key="view-dup" onClick={() => handleMarkAsDuplicateJob("VIEW")} className="cursor-pointer w-fit h-11 pl-3.5 pr-4 py-2 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-blue-600 inline-flex justify-center items-center gap-0.5">
        <Flag size={16} className="text-blue-600" />
      </div>
    ),

    PUSH_TO_RECRUITER: (
      <button key="push-recruiter" title="Send to evaluator" className="flex gap-2 items-center btn-sky" onClick={() => console.log("Push to recruiter")}>
        <Users size={16} /> {/*_CS Added Users icon instead of Plane icon and removed text */}
      </button>
    ),

    // Placeholder buttons for actions not yet implemented
    // INTERVIEW: <button className="btn_t1" key="interview">Interview</button>,
    VIEW_DOCUMENT: (
      <button className="btn_t1" key="view-doc" title="View Document" onClick={() => setIsRequestDocModalOpen(
        { isOpen: true, jobApplication: row, mode: 'VIEW', onClose: () => setIsRequestDocModalOpen({ isOpen: false, jobApplication: {} as JobApplicationDetailsDto, mode: 'REQUEST', onClose: () => {} }) }
      )}>
        <FileText size={16} /> {/*_CS Added FileText icon for View Document button */}
      </button>
    ),
    VIEW_OFFER_LETTER_ISSUE: (
      <button className="btn_t1" key="view-issues" title="View Issues">
        <AlertTriangle size={16} /> {/*_CS Added AlertTriangle icon for View Issues button */}
      </button>
    ),

    RESEND_OFFER_LETTER: (
      <button className="btn_t1" key="resend-offer" title="Resend Offer Letter">
        <Plane size={16} /> {/*_CS Added Plane icon for Resend Offer Letter button */}
      </button>
    ),

    JOINED: (
      <button key="joined" title="Joined" onClick={() => handleStatusUpdate("JOINED", row)} className="btn-sky flex gap-2 items-center">
        <UserCheck size={16} /> {/*_CS Added UserCheck icon instead of image and text */}
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
      "ACCEPT",
      "PUSH_TO_RECRUITER", // Primary actions
      "MARK_DUPLICATE",
      "VIEW_DUPLICACY", // Duplicate handling
      "VIEW_CV",
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
      "ONHOLD", // Secondary actions
      "NOTES",
      "REJECT",
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
