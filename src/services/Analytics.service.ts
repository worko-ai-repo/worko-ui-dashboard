import httpServiceObj from "@Services/ApiHandler.service";
import {
  AnalyticsHomePageResponse,
  FunnelVelocityResponse,
  OnboardingPipelineResponse,
  CriticalDropoffResponse,
  AnalyticsRecruitersResponse,
  HiringTrendResponse,
} from "@Interfaces/Analytics.dto";

type DateRangeParam = "7d" | "30d" | "90d" | "180d";

class AnalyticsService {
  async getHome(params: {
    companyId?: string;
    recruiterId?: string;
    dateRange?: "7d" | "30d" | "90d" | "180d";
    jobStatus?: "ALL" | "PUBLISHED";
  }): Promise<AnalyticsHomePageResponse> {
    const query: Record<string, string> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (params.recruiterId) query.recruiterId = params.recruiterId;
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;

    const { response, error } = await httpServiceObj.get<AnalyticsHomePageResponse>(
      "/analytics/home",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error("[AnalyticsService]: Failed to fetch analytics home data.", error);
      return {
        totalJobs: 0,
        totalApplications: 0,
        activeJobs: 0,
        closedJobs: 0,
        applicationsByStatus: {} as any,
        recentActivity: {
          jobsPostedLast7Days: 0,
          applicationsLast7Days: 0,
          applicationsLast30Days: 0,
        },
        recruiterOptions: [],
      };
    }

    return response;
  }

  // NOTE: getJobsWithApplications has been deprecated along with the backend endpoint.

  async getFunnelVelocityAggregate(params: {
    companyId?: string;
    recruiterId?: string;
    jobIds?: string[];
    dateRange?: DateRangeParam;
    jobStatus?: "ALL" | "PUBLISHED";
  }): Promise<FunnelVelocityResponse | null> {
    const query: Record<string, string> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (params.recruiterId) query.recruiterId = params.recruiterId;
    if (params.jobIds && params.jobIds.length) query.jobIds = params.jobIds.join(",");
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;

    const { response, error } = await httpServiceObj.get<FunnelVelocityResponse>(
      "/analytics/funnel-velocity",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error(
        "[AnalyticsService]: Failed to fetch aggregate funnel velocity analytics.",
        error
      );
      return null;
    }

    return response;
  }

  async getOnboardingPipeline(params: {
    companyId?: string;
    recruiterId?: string;
    jobId?: string;
    status?: string;
    includeDetails?: boolean;
    dateRange?: "7d" | "30d" | "90d" | "180d";
    jobStatus?: "ALL" | "PUBLISHED";
  }): Promise<OnboardingPipelineResponse> {
    const query: Record<string, string | boolean> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (params.recruiterId) query.recruiterId = params.recruiterId;
    if (params.jobId) query.jobId = params.jobId;
    if (params.status) query.status = params.status;
    if (typeof params.includeDetails === "boolean") {
      query.includeDetails = params.includeDetails;
    }
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;

    const { response, error } = await httpServiceObj.get<OnboardingPipelineResponse>(
      "/analytics/onboarding-pipeline",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error("[AnalyticsService]: Failed to fetch onboarding pipeline analytics.", error);
      return {
        totalHired: 0,
        totalJoined: 0,
        pendingJoining: 0,
        averageDaysToJoin: 0,
        candidates: [],
      };
    }

    return response;
  }

  async getDropoff(params: {
    companyId?: string;
    recruiterId?: string;
    jobId?: string;
    dateRange?: "7d" | "30d" | "90d" | "180d";
    jobStatus?: "ALL" | "PUBLISHED";
    topN?: number;
  }): Promise<CriticalDropoffResponse> {
    const query: Record<string, string> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (params.recruiterId) query.recruiterId = params.recruiterId;
    if (params.jobId) query.jobId = params.jobId;
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;
    if (typeof params.topN === "number") query.topN = String(params.topN);

    const { response, error } = await httpServiceObj.get<CriticalDropoffResponse>(
      "/analytics/dropoff",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error("[AnalyticsService]: Failed to fetch dropoff analytics.", error);
      return {
        totalApplications: 0,
        totalDropoffs: 0,
        overallDropoffRate: 0,
        dropoffByStage: [],
        jobsWithHighestDropoff: [],
      };
    }

    return response;
  }

  async getRecruiters(params: {
    companyId?: string;
    includeJobCounts?: boolean;
    dateRange?: "7d" | "30d" | "90d" | "180d";
    jobStatus?: "ALL" | "PUBLISHED";
  }): Promise<AnalyticsRecruitersResponse> {
    const query: Record<string, string | boolean> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (typeof params.includeJobCounts === "boolean") {
      query.includeJobCounts = params.includeJobCounts;
    }
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;

    const { response, error } = await httpServiceObj.get<AnalyticsRecruitersResponse>(
      "/analytics/recruiters",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error("[AnalyticsService]: Failed to fetch recruiters for analytics.", error);
      return {
        recruiters: [],
      };
    }

    return response;
  }

  async getHiringTrend(params: {
    companyId?: string;
    recruiterId?: string;
    granularity: "daily" | "weekly" | "monthly";
    dateRange?: "7d" | "30d" | "90d" | "180d";
    jobStatus?: "ALL" | "PUBLISHED";
  }): Promise<HiringTrendResponse> {
    const query: Record<string, string> = {};

    if (params.companyId) query.companyId = params.companyId;
    if (params.recruiterId) query.recruiterId = params.recruiterId;
    query.granularity = params.granularity;
    if (params.dateRange) query.dateRange = params.dateRange;
    if (params.jobStatus) query.jobStatus = params.jobStatus;

    const { response, error } = await httpServiceObj.get<HiringTrendResponse>(
      "/analytics/hiring-trend",
      true,
      query,
      false,
      "JOB"
    );

    if (error || !response) {
      console.error("[AnalyticsService]: Failed to fetch hiring trend analytics.", error);
      return {
        granularity: params.granularity,
        points: [],
      };
    }

    return response;
  }
}

const AnalyticsServiceObj = new AnalyticsService();
export default AnalyticsServiceObj;

