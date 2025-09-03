import {
  JobApplicationStatusType,
  JobStatusType,
  ReferralStatusType,
  UserGuidanceRequestStatusType,
  UserGuidanceRequestType,
} from "../JobsAndApplication.type";
import { StatusTracker } from "@Components/Dashboard/Candidate/Pages/Job/JobTypes";
import { ApplicantDetails } from "./CorporateDashboard.dto";

/**
 * APIResponseDto
 *
 * @description - This interface defines the structure of a generic API response for paginated data.
 */
export interface ApiResponseDto<T> {
  data: T[];
  pagination: {
    count: number;
    pageSize: number;
  };
}

/**
 * CursorPaginationJobDataParams
 *
 * @description - This interface defines the parameters for cursor-based pagination of job data in corporate services.
 */
export interface CursorPaginationAdminJobDataParams {
  pageSize: number;
  sortOrder: "asc" | "desc";
  dashboard: string;
  status: JobStatusType;
  searchText?: string;
  lastKey?: string | undefined;
}

/**
 * CursorPaginationApplicationDataAdminParams
 */

export interface CursorPaginationApplicationDataAdminParams {
  pageSize: number;
  sortOrder: "ascending" | "descending";
  status?: JobApplicationStatusType;
  searchText?: string;
  jobId?: string | undefined;
  userType?: string;
  lastKey?: string | undefined;
}

/**
 * CursorPaginationEmployeeDataAdminParams
 */
export interface CursorPaginationUsersDataAdminParams {
  pageSize: number;
  userType: "CAND" | "EMP";
  sortOrder: "ascending" | "descending";
  searchText?: string;
  lastKey?: string | undefined;
}

/**
 * CursorPaginationReferralsDataAdminParams
 *
 * @description - Parameters for paginating referral data in admin services.
 */
export interface CursorPaginationReferralsDataAdminParams {
  pageSize: number;
  sortOrder: "ascending" | "descending";
  searchText?: string;
  lastKey?: string | undefined;
  status?: ReferralStatusType;
  fromDate?: string; // ISO date string
  toDate?: string; // ISO date string
}

/**
 * CursorPaginationGuidanceDataAdminParams
 *
 * @description - Parameters for paginating guidance data in admin services.
 */
export interface CursorPaginationGuidanceDataAdminParams {
  pageSize: number;
  sortOrder: "ascending" | "descending";
  actionByUserType: string;
  searchText?: string;
  lastKey?: string | undefined;
}

/**
 * AdminBulkJobApplicationUpdateItem
 */
export interface AdminBulkJobApplicationUpdateItem {
  id: string;
  emailId: string;
  jobApplicationId: string;
  status: JobApplicationStatusType;
  oldStatus: JobApplicationStatusType;
  userType: string;
  applicantName: string;
  oldStatusTracker: StatusTracker[]; //@TODO:Makesure its not changed for admin service
  applicantUserId: string;
}

/**
 * GuidanceRequest
 *
 * @description - Data Transfer Object representing a guidance request made by a candidate.
 */
export interface GuidanceRequestDto {
  jobUrl: string;
  guidanceRequestDeadline: string; // ISO date string
  companyName: string;
  status: UserGuidanceRequestStatusType;
  createdAt: string;
  guidanceRequestDescription: string;
  mentorAssignedRemarks: string;

  //----- Candidate details -----
  userDetails: ApplicantDetails;

  // --- Status & Tracking ---
  statusTracker: GuidanceStatusTracker[];
  GSI1PK: string;
  GSI1SK: string;
  PK: string;
  SK: string;
  id: string;

  // --- User tracking ---
  createdByUserId: string;
  updatedByUserId: string;
  updatedAt: string;

  // --- Mentor details ---
  mentorDetails: MentorDetails;

  // --- Meeting details ---
  scheduleMeetingDetails?: ScheduleMeetingDetails;
  rescheduleMeetingDetails?: RescheduleMeetingDetails[];

  // --- Payment details ---
  paymentRequestDetails?: PaymentRequestDetails;
  paymentConfirmationPendingDetails?: PaymentConfirmationPendingDetails;
  paymentConfirmationDoneDetails?: PaymentConfirmationDoneDetails;

  // --- Request type ---
  guidanceRequestType: UserGuidanceRequestType;
}

export interface GuidanceStatusTracker {
  actionByUserId: string;
  newStatus: string;
  oldStatus?: string;
  actionDate: string;
  actionByUserType: string;
}

export interface MentorDetails {
  name: string;
  userId: string;
  userEmail: string;
}

export interface ScheduleMeetingDetails {
  date: string; // ISO date string
  duration: string;
  time: string;
  meetingLink?: string;
}

export interface RescheduleMeetingDetails {
  date: string; // ISO date string
  time: string;
  actionByUserId: string;
  actionByUserType:  string;
  actionDate: string;
}

export interface PaymentRequestDetails {
  totalAmount: number;
  guidanceFee: number;
  platformFee: number;
  currency: string;
  linkForPayment: string;
  actionByUserId: string;
  actionByUserType:  string;
  actionDate: string;
}

export interface PaymentConfirmationPendingDetails {
  actionByUserId: string;
  actionByUserType:  string;
  actionDate: string;
}

export interface PaymentConfirmationDoneDetails {
  actionByUserId: string;
  actionByUserType:  string;
  actionDate: string;
  uniqueTransactionReference: string; // this is your UTR number
}
