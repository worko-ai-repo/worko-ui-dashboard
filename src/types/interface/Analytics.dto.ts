import { JobApplicationStatusEnum, JobStatusTypeEnum } from "@Enums/JobAndApplication.enum";

export interface AnalyticsRecruiterOption {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName?: string;
}

export interface AnalyticsHomePageResponse {
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  closedJobs: number;
  applicationsByStatus: Record<JobApplicationStatusEnum, number>;
  recentActivity: {
    jobsPostedLast7Days: number;
    applicationsLast7Days: number;
    applicationsLast30Days: number;
  };
  recruiterOptions?: AnalyticsRecruiterOption[];
}

export interface JobWithApplicationsItem {
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  department: string;
  location: {
    city?: string[];
    state?: string[];
    country?: string[];
    fullLocation?: string[];
  } | null;
  status: JobStatusTypeEnum;
  createdAt: string;
  poster: {
    id: string;
    name: string;
    email: string;
    type: "corporate-recruiter" | "corporate-admin" | "worko-admin";
  };
  applications: {
    total: number;
    byStatus: Record<JobApplicationStatusEnum, number>;
  };
}

export interface JobWithApplicationsResponse {
  data: JobWithApplicationsItem[];
  pagination: {
    count: number;
    pageSize: number;
    lastKey?: string;
  };
}

export interface FunnelStageMetrics {
  average: number;
  median: number;
  min: number;
  max: number;
  sampleSize: number;
}

export interface StageBreakdown {
  fromStatus: string;
  toStatus: string;
  averageDays: number;
  medianDays: number;
  applicationsCount: number;
}

export interface FunnelVelocityResponse {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  applicationsAnalyzed: number;
  averageDaysPerStage: Record<string, FunnelStageMetrics>;
  overallAverageDays: number;
  stageBreakdown: StageBreakdown[];
}

export interface OnboardingCandidate {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  hiredDate: string;
  joinedDate?: string;
  daysToJoin?: number;
}

export interface OnboardingPipelineResponse {
  totalHired: number;
  totalJoined: number;
  pendingJoining: number;
  averageDaysToJoin: number;
  candidates: OnboardingCandidate[];
}

export interface DropoffStage {
  stage: JobApplicationStatusEnum;
  applicationsReached: number;
  dropoffs: number;
  dropoffRate: number;
  averageDaysBeforeDropoff: number;
}

export interface JobDropoffMetrics {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  dropoffs: number;
  dropoffRate: number;
  criticalDropoffStage: JobApplicationStatusEnum;
}

export interface CriticalDropoffResponse {
  totalApplications: number;
  totalDropoffs: number;
  overallDropoffRate: number;
  dropoffByStage: DropoffStage[];
  jobsWithHighestDropoff: JobDropoffMetrics[];
}

export interface AnalyticsRecruitersResponse {
  recruiters: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId: string;
    companyName: string;
    userType: string;
    jobsPosted: number;
  }[];
}

export type HiringTrendGranularity = "daily" | "weekly" | "monthly";

export interface HiringTrendPoint {
  periodStart: string;
  periodEnd: string;
  jobsPosted: number;
  applications: number;
  hires: number;
}

export interface HiringTrendResponse {
  granularity: HiringTrendGranularity;
  points: HiringTrendPoint[];
}
