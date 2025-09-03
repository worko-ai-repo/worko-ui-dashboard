import { ReferralStatusEnum, UserGuidanceRequestTypeEnum } from "@Enums/JobAndApplication.enum";
import { ReferralStatusType, UserGuidanceRequestStatusType } from "./JobsAndApplication.type";
import { TimelineStep } from "@Components/Shared/Timeline";

/**
 * CommonPaginationPageSizeOptions
 *
 * @description Defines the available options for pagination page sizes.
 */
export const CommonPaginationPageSizeOptions = [
  { label: "10 items", value: 10 },
  { label: "25 items", value: 25 },
  { label: "50 items", value: 50 },
  { label: "100 items", value: 100 },
  { label: "150 items", value: 150 },
  { label: "200 items", value: 200 },
];

/**
 * STATUS_LABELS
 *
 * @description Maps each referral status enum to its corresponding human-readable label.
 */
export const STATUS_LABELS: Record<ReferralStatusEnum, string> = {
  [ReferralStatusEnum.AWAITING]: "Requested",
  [ReferralStatusEnum.ACCEPTED]: "Accepted",
  [ReferralStatusEnum.DONE]: "Done",
  [ReferralStatusEnum.REJECTED]: "Rejected",
  [ReferralStatusEnum.WITHDRAWN]: "Withdrawn",
  [ReferralStatusEnum.CANCELLED]: "Cancelled",
};

/**
 * STATUS_TYPE_MAP
 *
 * @description Maps each referral status to a timeline step type 
 * (success, error, or warning) for UI representation.
 */
export const STATUS_TYPE_MAP: Partial<Record<ReferralStatusType, TimelineStep["status"]>> = {
  [ReferralStatusEnum.AWAITING]: "success",
  [ReferralStatusEnum.ACCEPTED]: "success",
  [ReferralStatusEnum.DONE]: "success",
  [ReferralStatusEnum.REJECTED]: "error",
  [ReferralStatusEnum.WITHDRAWN]: "warning",
  [ReferralStatusEnum.CANCELLED]: "warning",
};

/**
 * REFERRAL_STATUS_COLORS
 *
 * @description Provides background and text color classes for each referral status.
 */
export const REFERRAL_STATUS_COLORS: Record<ReferralStatusType, string> = {
  DONE: "bg-[#A0CEFF] text-[#316BFF]", // Blue and dark blue text
  ACCEPTED: "bg-[#A0FFA5] text-[#00B542]", // Green and dark green text
  AWAITING: "bg-[#FFF3A0] text-[#FFB800]", // Yellow and dark yellow text
  REJECTED: "bg-[#FFA0A0] text-[#FF3B3B]", // Red and dark red text
  WITHDRAWN: "bg-[#FFD1A0] text-[#FF6F00]", // Orange and dark orange text
  CANCELLED: "bg-[#E0E0E0] text-[#6B6B6B]", // Grey and dark grey text
};

/**
 * REFERRAL_STATUS_LABELS
 *
 * @description Maps each referral status type to its simplified label for display.
 */
export const REFERRAL_STATUS_LABELS: Record<ReferralStatusType, string> = {
  DONE: "Referred",
  ACCEPTED: "Accepted",
  AWAITING: "Awaiting",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  CANCELLED: "Cancelled",
};

/**
 * GUIDANCE_STATUS_COLORS
 * 
 * @description - Provides background and text color classes for each guidance request status.
 */
export const GUIDANCE_STATUS_COLORS: Record<UserGuidanceRequestStatusType, string> = {
  PENDING: "bg-[#FFF3A0] text-[#FFB800]", // Yellow and dark yellow text
  MENTOR_ASSIGNED: "bg-[#A0CEFF] text-[#316BFF]", // Blue and dark blue text
  PAYMENT_CONFIRMATION_PENDING: "bg-[#FFD1A0] text-[#FF6F00]", // Orange and dark orange text
  PAYMENT_CONFIRMATION_DONE: "bg-[#A0FFA5] text-[#00B542]", // Green and dark green text
  MEETING_CONFIRMED: "bg-[#A0FFA5] text-[#00B542]", // Green and dark green text
  MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE: "bg-[#FFA0A0] text-[#FF3B3B]", // Red and dark red text
  MEETING_RESCHEDULE_REQUESTED_BY_MENTOR: "bg-[#FFA0A0] text-[#FF3B3B]", // Red and dark red text
  MEETING_RESCHEDULE_CONFIRMED: "bg-[#A0FFA5] text-[#00B542]", // Green and dark green text
  REJECTED: "bg-[#FFA0A0] text-[#FF3B3B]", // Red and dark red text
  CANCELLED: "bg-[#E0E0E0] text-[#6B6B6B]", // Grey and dark grey text
  PROJECT_COMPLETED: "bg-[#D1FFD1] text-[#008000]", // Light green and dark green text
};

/**
 * GUIDANCE_STATUS_LABELS
 * 
 * @description - Maps each guidance request status type to its simplified label for display.
 */
export const GUIDANCE_STATUS_LABELS: Record<UserGuidanceRequestStatusType, string> = {
  PENDING: "Pending",
  MENTOR_ASSIGNED: "Mentor Assigned",
  PAYMENT_CONFIRMATION_PENDING: "Payment Pending",
  PAYMENT_CONFIRMATION_DONE: "Payment Done",
  MEETING_CONFIRMED: "Meeting Confirmed",
  MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE: "Reschedule Requested by Candidate",
  MEETING_RESCHEDULE_REQUESTED_BY_MENTOR: "Reschedule Requested by Mentor",
  MEETING_RESCHEDULE_CONFIRMED: "Reschedule Confirmed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  PROJECT_COMPLETED: "Completed",
};

/**
 * GUIDANCE_REQUEST_TYPE_LABELS
 * 
 * @description - Maps each guidance request type to its human-readable label.
 */
export const GUIDANCE_REQUEST_TYPE_LABELS: Record<UserGuidanceRequestTypeEnum, string> = {
  INTERVIEW_HAND_HOLDING: "Interview Hand Holding",
  MOCK_INTERVIEW_PREPARATION: "Mock Interview Preparation",
  HELP_WITH_ASSIGNMENT: "Help with Assignment",
  CAREER_GUIDANCE: "Career Guidance",
  RESUME_REVIEW: "Resume Review",
  OTHER: "Other",
};