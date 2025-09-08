import { JobApplicationStatusEnum } from "@Enums/JobAndApplication.enum";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import jobApplicationServiceObj from "./ApplicationPage.utils";
import { RBAC } from "./RoleBaseAccessControll.utils";

// Extended action types to cover all buttons
export type JobApplicationActionType =
  | "ACCEPT"
  | "MARK_DUPLICATE"
  | "REJECT"
  | "NOTES"
  | "ONHOLD"
  | "PUSH_TO_RECRUITER"
  | "VIEW_CV"

  // | "EVALUATION" //DD
  | "SEND_TO_EVALUATOR"
  | "VIEW_EVALUATION"
  | "PROCESS_INTERVIEW"
  // | "INTERVIEW" //DD
  | "INTERVIEW_DONE"
  | "HIRE"
  | "REQUEST_DOCUMENT"
  | "VIEW_DOCUMENT"
  | "HIRE_NOW"
  | "VIEW_OFFER_LETTER_ISSUE"
  | "JOINED"
  | "VIEW_DUPLICACY";

export type TabType = "All" | "Hired" | "Joined";

export interface ActionVisibilityConfig {
  visible: boolean;
  // Conditional visibility based on application data
  condition?: (application: JobApplicationDetailsDto) => boolean;
  // Tab-specific overrides
  tabOverrides?: Partial<Record<TabType, boolean>>;
}

export type ActionVisibilityMap = Record<JobApplicationActionType, ActionVisibilityConfig>;

/**
 * Helper functions for common conditions
 */
export const CONDITIONS = {
  canAccept: (app: JobApplicationDetailsDto): boolean => {
      return RBAC.can("manage_users");
  },
  hasOfferLetterIssue: (app: JobApplicationDetailsDto): boolean => {
    return Boolean(app?.status === JobApplicationStatusEnum.OFFER_ISSUE_RAISED); 
  },
  hasEvaluatorResponse: (app: JobApplicationDetailsDto) => {
    return Boolean(app.isEvaluatorResponded);
  },
  isStale: (app: JobApplicationDetailsDto) =>
    isApplicationStatusStale(app.status, app.statusTracker),
  shouldShowPushToRecruiter: (app: JobApplicationDetailsDto) =>
    jobApplicationServiceObj.showPushToRecruiterButton(app),
  hasDuplicacyInfo: (app: JobApplicationDetailsDto) =>
    Boolean(app?.hiredFromOtherPortal?.portal && app?.hiredFromOtherPortal?.date),
  canMarkDuplicate: (app: JobApplicationDetailsDto) =>
    CONDITIONS.isStale(app) && !CONDITIONS.hasDuplicacyInfo(app),
  hasDocumentResponse: (app: JobApplicationDetailsDto) =>
    Boolean(app?.responseDocumentDetails && app?.responseDocumentDetails?.length > 0),
};

// Helper functions (moved from JobApplicationActions)
function isApplicationStatusStale(status: JobApplicationStatusType, statusTracker: any[]): boolean {
  if (!status || !statusTracker) return false;
  const found = [...statusTracker].reverse().find((entry) => entry.newStatus === status);
  if (!found || !found.actionDate) return false;
  const downloadedDate = new Date(found.actionDate).getTime();
  const now = new Date().getTime();
  const diffInHours = (now - downloadedDate) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

/**
 * Default visibility configurations for different status categories
 */
const HIDDEN_ALL: ActionVisibilityMap = Object.fromEntries(
  Object.values([
    "ACCEPT",
    "REJECT",
    "HIRE",
    "HIRE_NOW",
    "PROCESS_INTERVIEW",
    "INTERVIEW_DONE",
    "ONHOLD",
    "VIEW_CV",
    "VIEW_EVALUATION",
    "SEND_TO_EVALUATOR",
    "NOTES",
    "REQUEST_DOCUMENT",
    "VIEW_DOCUMENT",
    "VIEW_OFFER_LETTER_ISSUE",
    "JOINED",
    "MARK_DUPLICATE",
    "VIEW_DUPLICACY",
    "PUSH_TO_RECRUITER",
    "RESEND_OFFER_LETTER",
  ] as JobApplicationActionType[]).map((action) => [action, { visible: false }])
) as ActionVisibilityMap;

/**
 * Get comprehensive action visibility configuration for a job application
 */
export function getActionVisibilityConfig(
  status: JobApplicationStatusType,
  activeTab: TabType = "All"
): ActionVisibilityMap {
  let baseConfig: ActionVisibilityMap;

  switch (status) {
    case JobApplicationStatusEnum.ALL:
      return HIDDEN_ALL;

    case JobApplicationStatusEnum.APPLIED:
      baseConfig = {
        ...HIDDEN_ALL,
        PUSH_TO_RECRUITER: {
          visible: true && RBAC.can("push_to_recruiter"),
          condition: CONDITIONS.shouldShowPushToRecruiter,
        },
        ACCEPT: { visible: true, condition: CONDITIONS.canAccept },
        REJECT: { visible: true },
      };
      break;

    case JobApplicationStatusEnum.ACCEPTED:
    case JobApplicationStatusEnum.CV_DOWNLOADED:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        SEND_TO_EVALUATOR: { visible: true },
        NOTES: { visible: true },
        MARK_DUPLICATE: {
          visible: false,
          condition: (application) =>
            CONDITIONS.canMarkDuplicate(application) && RBAC.can("play_corporate"),
        },
        VIEW_DUPLICACY: {
          visible: false,
          condition: CONDITIONS.hasDuplicacyInfo,
        },
        HIRE: {
          visible: true,
        },
        REJECT: { visible: true },
        ONHOLD: { visible: true },
      };
      break;

    case JobApplicationStatusEnum.UNDER_EVALUATION:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        HIRE: { visible: true },
        NOTES: { visible: true },
        REJECT: { visible: true },
        ONHOLD: { visible: true },
        PROCESS_INTERVIEW: { visible: true },
        VIEW_EVALUATION: {
          visible: true,
          condition: CONDITIONS.hasEvaluatorResponse,
        },
      };
      break;

    case JobApplicationStatusEnum.PROCESSING_INTERVIEW:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        HIRE: { visible: true },
        REJECT: { visible: true },
        ONHOLD: { visible: true },
        NOTES: { visible: true },
        INTERVIEW_DONE: { visible: true /* ,condition: CONDITIONS.hasEvaluatorResponse */ },
        VIEW_EVALUATION: {
          visible: false,
          condition: CONDITIONS.hasEvaluatorResponse,
        },
      };
      break;

    case JobApplicationStatusEnum.INTERVIEW_DONE:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        HIRE: { visible: true },
        NOTES: { visible: true },
        VIEW_EVALUATION: {
          visible: false,
          condition: CONDITIONS.hasEvaluatorResponse,
        },
        REJECT: { visible: true },
        ONHOLD: { visible: true },
      };
      break;

    case JobApplicationStatusEnum.HIRING_IN_PROCESS:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        HIRE_NOW: { visible: true, tabOverrides: { All: true, Hired: true } },
        NOTES: { visible: true },
        REJECT: { visible: true },
        ONHOLD: { visible: true },
        REQUEST_DOCUMENT: { visible: true, tabOverrides: { All: true, Hired: true } },
      };
      break;

    case JobApplicationStatusEnum.DOCUMENT_REQUESTED:
    case JobApplicationStatusEnum.DOCUMENT_REVISION_REQUESTED:
    case JobApplicationStatusEnum.DOCUMENT_REVISION_REQUEST_SUBMITTED:
    case JobApplicationStatusEnum.DOCUMENT_ADDITIONAL_REQUESTED:
    case JobApplicationStatusEnum.DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED:
    case JobApplicationStatusEnum.DOCUMENT_SUBMITTED:
      baseConfig = {
        ...HIDDEN_ALL,
        REJECT: { visible: true },
        ONHOLD: { visible: true },
        VIEW_CV: { visible: true },
        NOTES: { visible: true },
        VIEW_DOCUMENT: {
          visible: true,
          tabOverrides: { All: true, Hired: true },
          //@TODO::CONDITION: CONDITIONS.hasEvaluatorResponse AND ADD CONDTIONS BELOW
          // condition: CONDITIONS.hasDocumentResponse
        },
        HIRE_NOW: { visible: true, tabOverrides: { All: true, Hired: true } },
      };
      break;

      case JobApplicationStatusEnum.DOCUMENT_VERIFIED:
        baseConfig = {
          ...HIDDEN_ALL,
          REJECT: { visible: true },
          ONHOLD: { visible: true },
          VIEW_CV: { visible: true },
          NOTES: { visible: true },
          HIRE_NOW: { visible: true, tabOverrides: { All: true, Hired: true } },
        };
        break;

    case JobApplicationStatusEnum.OFFER_SENT:
    case JobApplicationStatusEnum.REVISED_OFFER_SENT:
    case JobApplicationStatusEnum.OFFER_ISSUE_RAISED:
      baseConfig = {
        ...HIDDEN_ALL,
        REJECT: {
          visible: true,
          condition: CONDITIONS.canAccept,
          tabOverrides: { All: true, Hired: true },
        },
        ONHOLD: { visible: true },
        VIEW_CV: { visible: true },
        NOTES: { visible: true },
        VIEW_OFFER_LETTER_ISSUE: {
          visible: true,
          condition: CONDITIONS.hasOfferLetterIssue,
          tabOverrides: { All: true, Hired: true },
        },
        VIEW_DOCUMENT: {
          visible: true,
          tabOverrides: { All: true, Hired: true },
          //@TODO::CONDITION: CONDITIONS.hasEvaluatorResponse AND ADD CONDTIONS BELOW
          // condition: CONDITIONS.hasDocumentResponse
        },
      };

      break;

    case JobApplicationStatusEnum.HIRED:
      baseConfig = {
        ...HIDDEN_ALL,
        VIEW_CV: { visible: true },
        NOTES: { visible: true },
        JOINED: { visible: true, tabOverrides: { All: true, Hired: true } },
        REJECT: { visible: false, tabOverrides: { All: true, Hired: true } },
        ONHOLD: {
          visible: true,
          tabOverrides: { All: true, Hired: true },
        },
        VIEW_EVALUATION: {
          visible: false,
          condition: CONDITIONS.hasEvaluatorResponse,
        },
      };
      break;

    case JobApplicationStatusEnum.JOINED:
    case JobApplicationStatusEnum.REJECTED:
      baseConfig = {
        ...HIDDEN_ALL,
        NOTES: { visible: true },
        VIEW_CV: { visible: true },
      };
      break;

    case JobApplicationStatusEnum.ON_HOLD:
      baseConfig = {
        ...HIDDEN_ALL,
        REJECT: { visible: true },
        VIEW_EVALUATION: { visible: true, condition: CONDITIONS.hasEvaluatorResponse },
        // INTERVIEW: { visible: true },
        VIEW_CV: { visible: true },
        NOTES: { visible: true },
      };
      break;

    default:
      console.warn(`Unhandled job application status: ${status}`);
      baseConfig = {
        ...HIDDEN_ALL,
        REJECT: { visible: true },
        HIRE: { visible: false },
        VIEW_EVALUATION: { visible: true, condition: CONDITIONS.hasEvaluatorResponse },
        // INTERVIEW: { visible: true },
        ONHOLD: { visible: true },
        VIEW_CV: { visible: true },
        NOTES: { visible: true },
      };
  }

  // Apply tab-specific overrides
  const finalConfig = { ...baseConfig };
  Object.entries(finalConfig).forEach(([action, config]) => {
    const actionKey = action as JobApplicationActionType;
    if (config.tabOverrides && activeTab in config.tabOverrides) {
      finalConfig[actionKey] = {
        ...config,
        visible: config.tabOverrides[activeTab] ?? config.visible,
      };
    }
  });

  return finalConfig;
}

/**
 * Helper function to check if an action should be visible
 */
// Whitelist of actions admin can see for corporate jobs
const ADMIN_ALLOWED_ACTIONS_FOR_CORPORATE: JobApplicationActionType[] = [
  "VIEW_CV",
  'ACCEPT',
  "REJECT",
  "NOTES",
  "VIEW_EVALUATION",
  "VIEW_DOCUMENT",
  "VIEW_DUPLICACY",
  "VIEW_OFFER_LETTER_ISSUE",
];

// Helper to check if job was posted by Worko
const isWorkoJob = (app: JobApplicationDetailsDto) =>
  Boolean(app?.companyId === import.meta.env.APP_WORKO_COMP_ID); // true => Worko job, false => corporate job

export function shouldShowAction(
  action: JobApplicationActionType,
  application: JobApplicationDetailsDto,
  activeTab: TabType = "All"
): boolean {
  const config = getActionVisibilityConfig(
    application.status as JobApplicationStatusType,
    activeTab
  );
  // console.log("Action Config:", config,action);
  const actionConfig = config[action];

  // Not configured or explicitly hidden
  if (!actionConfig || !actionConfig.visible) {
    return false;
  }

  // Admin + Non Worko job => only whitelist actions that are mentioned, still respect visible + condition
  if (RBAC.can("play_admin") && !isWorkoJob(application)) {
    if (!ADMIN_ALLOWED_ACTIONS_FOR_CORPORATE.includes(action)) {
      return false;
    }
  }

  // Apply condition if present
  if (actionConfig.condition) {
    return actionConfig.condition(application);
  }

  return true;
}
