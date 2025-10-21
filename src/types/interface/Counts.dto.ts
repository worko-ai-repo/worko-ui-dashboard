// Base structure (shared fields)
export interface BaseGlobalCount {
    PK: string;
    SK: string;
    createdAt: string;
    updatedAt: string;
    entityType: string;
  }
  
  // Candidate counts
  export interface CandidateGlobalCount extends BaseGlobalCount {
    entityType: "CANDIDATE";
    candidateJobApplicationCounts: {
      total: number;
      rejected: number;
      processingInterview: number;
      applied: number;
      hired: number;
    };
  }
  
  // Employee counts
  export interface EmployeeGlobalCount extends BaseGlobalCount {
    entityType: "EMPLOYEE";
    employeeJobApplicationCounts: {
      total: number;
      rejected: number;
      processingInterview: number;
      applied: number;
      hired: number;
    };
  }
  
  // Corporate Job & Applicant counts
  export interface CompanyJobGlobalCount extends BaseGlobalCount {
    entityType: "COMPANY_JOB";
    companyJobApplicationCounts: {
      total: number;
      rejected: number;
      processingInterview: number;
      applied: number;
      hired: number;
    };
  }
  
  // Referral counts
  export interface ReferralGlobalCount extends BaseGlobalCount {
    entityType: "REFERRAL";
    referralCounts: {
      totalReferee: number;
      awaiting: number;
      accepted: number;
      done: number;
      rejected: number;
    };
  }
  
  // Refer & Earn counts
  export interface ReferAndEarnGlobalCount extends BaseGlobalCount {
    entityType: "REFER_AND_EARN";
    referAndEarnJobApplicationCounts: {
      total: number;
      pending: number;
      applied: number;
      hired: number;
      rejected: number;
    };
  }
  
  // Applicants (company scoped)
  export interface ApplicantGlobalCount extends BaseGlobalCount {
    PK: `COMP#ID#${string}#`;
    SK: `JOB#${string}#MET#ENT#JOB_APPLICATION`;
    entityType: "JOB_APPLICATION";
    jobId: string;
    companyId: string;
    allJobApplicationCounts: {
      total: number;
      processingInterview: number;
      applied: number;
      hired: number;
      rejected: number;
    };
  }
  
  // Job-level counts (company scoped)
  export interface JobGlobalCount extends BaseGlobalCount {
    PK: `COMP#ID#${string}`;
    SK: "MET#ENT#JOB_APPLICATION";
    entityType: "JOB_APPLICATION";
    GSI1PK: "COMP#MET#";
    GSI1SK: "ENT#JOB_APPLICATION";
    companyId: string;
    allJobApplicationCounts: {
      total: number;
      processingInterview: number;
      applied: number;
      hired: number;
      rejected: number;
    };
  }
  
  // Union type for all possible responses
  export type GlobalCountResponse =
    | CandidateGlobalCount
    | EmployeeGlobalCount
    | CompanyJobGlobalCount
    | ReferralGlobalCount
    | ReferAndEarnGlobalCount
    | ApplicantGlobalCount
    | JobGlobalCount;
  