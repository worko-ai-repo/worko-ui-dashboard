import httpServiceObj from "@Services/ApiHandler.service";
import {
  FunnelVelocityResponse,
  OnboardingPipelineResponse,
  CriticalDropoffResponse,
  HiringTrendResponse,
} from "@Interfaces/Analytics.dto";

type DateRangeParam = "7d" | "30d" | "90d" | "180d";

/**
 * Analytics Service
 * Handles all analytics-related API calls for hiring trends, onboarding pipelines,
 * dropoff analysis, and funnel velocity metrics.
 */
class AnalyticsService {
  /**
   * Fetches aggregate funnel velocity analytics data.
   * Returns average time per stage in the hiring funnel.
   *
   * @param params - Query parameters
   * @param params.companyId - Optional company ID filter
   * @param params.recruiterId - Optional recruiter ID filter
   * @param params.jobIds - Optional array of job IDs to filter
   * @param params.dateRange - Date range filter (7d, 30d, 90d, 180d)
   * @param params.jobStatus - Job status filter (ALL, PUBLISHED)
   * @returns Funnel velocity response or null on error
   */
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

  /**
   * Fetches onboarding pipeline analytics data.
   * Returns information about hired candidates, joined candidates, and pending joinings.
   *
   * @param params - Query parameters
   * @param params.companyId - Optional company ID filter
   * @param params.recruiterId - Optional recruiter ID filter
   * @param params.jobId - Optional job ID filter
   * @param params.status - Optional status filter
   * @param params.includeDetails - Whether to include candidate details
   * @param params.dateRange - Date range filter (7d, 30d, 90d, 180d)
   * @param params.jobStatus - Job status filter (ALL, PUBLISHED)
   * @returns Onboarding pipeline response
   */
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

  /**
   * Fetches critical dropoff analytics data.
   * Returns dropoff rates by stage and identifies critical dropoff points.
   *
   * @param params - Query parameters
   * @param params.companyId - Optional company ID filter
   * @param params.recruiterId - Optional recruiter ID filter
   * @param params.jobId - Optional job ID filter
   * @param params.dateRange - Date range filter (7d, 30d, 90d, 180d)
   * @param params.jobStatus - Job status filter (ALL, PUBLISHED)
   * @param params.topN - Number of top dropoff stages to return
   * @returns Critical dropoff response
   */
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

  /**
   * Fetches hiring trend analytics data.
   * Returns time-series data for jobs posted, applications, and hires over time.
   *
   * @param params - Query parameters
   * @param params.companyId - Optional company ID filter
   * @param params.recruiterId - Optional recruiter ID filter
   * @param params.granularity - Time granularity (daily, weekly, monthly)
   * @param params.dateRange - Date range filter (7d, 30d, 90d, 180d)
   * @param params.jobStatus - Job status filter (ALL, PUBLISHED)
   * @returns Hiring trend response
   */
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
        totalJobs: 0,
        activeJobs: 0,
        closedJobs: 0,
      };
    }

    return response;
  }
}

const AnalyticsServiceObj = new AnalyticsService();
export default AnalyticsServiceObj;

