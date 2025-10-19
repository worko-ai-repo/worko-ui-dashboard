// src/components/Referrals/ReferralTypes.ts

export interface EmployeeDetails {
  name?: string;
}
export interface ReferralDetailsDto {
  id: string;
  candidateName: string;
  referredJobTitle: string;
  companyName: string;
  jobId: string;
  referrerEmail: string;
  candidateEmail: string;
  createdAt: string;
  status: ReferralStatus;
  matchingScore:number;
  refereeName:String;
  jobUrl:string;
  employeeDetails?:EmployeeDetails
}

export type ReferralStatus = 
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "AWAITING"
  | "DONE"
  | "ISSUE_RAISED" 
  | "COMPLETED"   
  | "CANCELLED"
  | "WITHDRAWN"

export interface PaginationInfo {
  count: number;
  pageSize: number;
  sortOrder: string;
  timesQueried: number;
  queriedCount: number;
  lastKey: string;
}

export interface ReferralApiResponse {
  data: ReferralDetailsDto[];
  pagination: PaginationInfo;
  totalReferrals?: number;
  currentPage?: number;
  totalPages?: number;
  matchingScore?: number;
}

export interface ReferralFilters {
  searchText?: string;
  companyId?: string;
  sortOrder?: "ascending" | "descending";
  userType?: string;
}
