import { JobApplicationStatusType } from "@Components/Shared/ApplicantsPage/BulkStatusDropDown";
import { JobStatusType } from "../jobs.type";
import { StatusTracker } from "@Components/Dashboard/Candidate/Pages/Job/JobTypes";

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
  status?: "ALL" | "APPLIED" | "CV_DOWNLOADED" | "UNDER_EVALUATION" | "PROCESSING_INTERVIEW" | "INTERVIEW_DONE" | "HIRED" | "REJECTED" | "ON_HOLD" | "JOINED";
  searchText?: string;
  userType?: string;
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
