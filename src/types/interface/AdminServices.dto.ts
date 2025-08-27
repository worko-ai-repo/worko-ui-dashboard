import { JobApplicationStatusType, JobStatusType } from "../JobsAndApplication.type";
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
  userType: 'CAND' | 'EMP' ;
  sortOrder: "ascending" | "descending";
  searchText?: string; //@TODO:Rohit: Add more filters if required
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
  searchText?: string; //@TODO:Rohit: Add more filters if required
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
