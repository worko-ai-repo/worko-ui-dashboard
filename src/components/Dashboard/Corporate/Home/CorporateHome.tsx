import { useEffect, useMemo } from "react";

// Define or import the missing types
type DateRange = "7d" | "30d" | "90d" | "180d";
type JobStatusFilter = "ALL" | "PUBLISHED";
import { StatCard } from "./StatCard";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@Context/App.context";
import AnalyticsServiceObj from "@Services/Analytics.service";
import {
  OnboardingPipelineResponse,
  CriticalDropoffResponse,
  HiringTrendResponse,
} from "@Interfaces/Analytics.dto";
import HiringIntelligence from "@Components/Shared/Home/HiringIntelligence";
import FunnelVelocity from "@Components/Shared/Home/FunnelVelocity";
import HiringTrend from "@Components/Shared/Home/HiringTrend";
import { newDisplayStatus } from "../Applicants/ApplicantsTable";
import { CorporateAnalyticsHomeSkeleton } from "@Components/Loader/Skeleton/SkeletonLoader";
import { JobApplicationStatusEnum } from "@Enums/JobAndApplication.enum";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { Loader } from "lucide-react";
import EvaluatorMatrix from "@Components/Shared/Home/EvaluatorMatrix";
import CorporateServiceObj from "../Services/Corporate.service";
import httpServiceObj from "@Services/ApiHandler.service";
import AgencyMatrix from "@Components/Shared/Home/AgencyMatrix";

/**
 * Corporate Home Analytics Component
 * Displays analytics dashboard for corporate users including:
 * - Hiring trends and KPIs
 * - Onboarding pipeline
 * - Critical dropoff stages
 * - Funnel velocity metrics
 * - Hiring intelligence table
 */
const CorporateHome = () => {
  const { userDetails } = useAppContext();
  const companyId = userDetails?.companyId;

  // Use URL state hook to persist filters in URL
  const { filters, setFilter } = useUrlState({
    filters: {
      dateRange: {
        defaultValue: "30d" as DateRange,
        serialize: (value: DateRange) => value,
        deserialize: (value: string) => value as DateRange,
      },
      jobStatus: {
        defaultValue: "ALL" as JobStatusFilter,
        serialize: (value: JobStatusFilter) => value,
        deserialize: (value: string) => value as JobStatusFilter,
      },
      recruiterId: {
        defaultValue: "" as string,
        serialize: (value: string) => value,
        deserialize: (value: string) => value,
      },
    },
  });

  const dateRange = (filters.dateRange || "30d") as DateRange;
  const jobStatus = (filters.jobStatus || "ALL") as JobStatusFilter;
  const selectedRecruiterId = filters.recruiterId || undefined;

  const { data: invitesResponse } = useQuery({
    queryKey: ["analyticsCorporateRecruitersInvites", companyId],
    enabled: !!companyId,
    queryFn: () =>
      CorporateServiceObj.fetchInvites({
        pageSize: 200,
        companyId,
        sortOrder: "descending",
      }),
  });

  const { data: companyDetails } = useQuery({
  queryKey: ["corporateCompanyDetails", companyId],
  enabled: !!companyId,
  queryFn: async () => {
      const { response, error } = await httpServiceObj.get<any>(`/company/${companyId}`, true, {});

      if (error) {
        console.error("Error fetching company details: ", error);
        return null;
      }
      return response;
    },
  });

  const name = userDetails?.fullName?.split(" ")
  const recruiters = useMemo(() => {
    const acceptedRecruiters =
      (invitesResponse?.data ?? []).filter(
        (inv) => inv.inviteStatus === "ACCEPTED"
      );

    if (companyDetails) {
      return [
        {...companyDetails[0], 
          firstName:name?.[0],
          lastName:name?.[1]
        },
        ...acceptedRecruiters,
      ];
    }

    return acceptedRecruiters;
  }, [invitesResponse, companyDetails]);

  useEffect(() => {
    if (filters.recruiterId || !recruiters.length) return;
    // Default to logged-in company record so APIs always scope correctly on first load.
    setFilter("recruiterId", recruiters[0].id);
  }, [filters.recruiterId, recruiters, setFilter]);

  // Fetch hiring trend analytics data
  const { data: hiringTrendSummary, isLoading: isHiringTrendLoading } =
    useQuery<HiringTrendResponse>({
      queryKey: ["analyticsHiringTrend", companyId, selectedRecruiterId, dateRange, jobStatus],
      enabled: !!companyId,
      queryFn: () =>
        AnalyticsServiceObj.getHiringTrend({
          companyId,
          recruiterId: selectedRecruiterId,
          granularity: "monthly",
          dateRange,
          jobStatus,
        }),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
    });

  // Fetch onboarding pipeline data
  const { data: onboarding, isLoading: isOnboardingLoading } = useQuery<OnboardingPipelineResponse>(
    {
      queryKey: ["analyticsOnboardingCorporate", companyId, selectedRecruiterId, dateRange, jobStatus],
      queryFn: () =>
        AnalyticsServiceObj.getOnboardingPipeline({
          companyId,
          recruiterId: selectedRecruiterId,
          includeDetails: true,
          dateRange,
          jobStatus,
        }),
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
    }
  );

  // Fetch critical dropoff analytics data
  const { data: dropoff, isLoading: isDropoffLoading } = useQuery<CriticalDropoffResponse>({
    queryKey: ["analyticsDropoffCorporate", companyId, selectedRecruiterId, dateRange, jobStatus],
    queryFn: () =>
      AnalyticsServiceObj.getDropoff({
        companyId,
        recruiterId: selectedRecruiterId,
        dateRange,
        jobStatus,
        topN: 5,
      }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
  });

  // Show skeleton loader while initial data is loading
  const isLoading = isHiringTrendLoading || isOnboardingLoading || isDropoffLoading;

  const totalDropoffRate = dropoff?.overallDropoffRate ?? 0;

  const selectedRecruiter = useMemo(() => {
    return recruiters.find(r => r.id === selectedRecruiterId);
  }, [recruiters, selectedRecruiterId]);

  // Show skeleton loader while data is loading
  if (isLoading && !hiringTrendSummary && !onboarding && !dropoff) {
    return <CorporateAnalyticsHomeSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-10 justify-between">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col w-full gap-2 justify-start">
          {/* <HeaderDetails /> */}

          {/* Filters */}
          {/* Filters Section - Date range and Job status filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">Analytics overview</p>
              <p className="text-xs text-slate-400">Job & application insights for your company</p>
            </div>

            <div className="flex flex-wrap items-end gap-4 text-xs">
              {/* <div className="flex items-center gap-4 text-xs"> */}

              {userDetails?.userType.includes("corporate-admin") 
                ? <div className="flex flex-col min-w-[200px]">
                  <label className="text-slate-500 mb-1.5 text-left">Recruiter</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs h-[44px] cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                    value={selectedRecruiterId ?? ""}
                    onChange={(e) => setFilter("recruiterId", e.target.value)}
                  >
                    {/* <option value="">All recruiters</option> */}
                    {recruiters.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.firstName} {inv.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                : null
              }

              {/* Date Range Filter */}
              <div className="flex flex-col">
                <label className="text-slate-500 mb-1.5 text-left">Date range</label>
                <div className="flex gap-2">
                {(["7d", "30d", "90d", "180d"] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setFilter("dateRange", range)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      dateRange === range
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}>
                    {range === "7d" && "Last 7 days"}
                    {range === "30d" && "Last 30 days"}
                    {range === "90d" && "Last 90 days"}
                    {range === "180d" && "Last 180 days"}
                  </button>
                ))}
                </div>
              </div>

              {/* Job Status Filter */}
              <div className="flex flex-col">
                <label className="text-slate-500 mb-1.5 text-left">Job status</label>
                <div className="flex gap-2">
                {(["ALL", "PUBLISHED"] as JobStatusFilter[]).map((statusValue) => (
                  <button
                    key={statusValue}
                    onClick={() => setFilter("jobStatus", statusValue)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      jobStatus === statusValue
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}>
                    {statusValue === "ALL" && "All jobs"}
                    {statusValue === "PUBLISHED" && "Published only"}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-screen">
            <div className="mx-auto space-y-2">
              {/* Top Row - KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {/* Total Jobs KPI */}
                <StatCard title="Total jobs">
                  <div className="text-3xl font-semibold text-slate-800">
                    {hiringTrendSummary?.totalJobs ?? (isHiringTrendLoading ? "--" : 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Across all recruiters in your company
                  </p>
                </StatCard>

                {/* Total Applications KPI */}
                <StatCard title="Total applications">
                  <div className="text-3xl font-semibold text-slate-800">
                    {dropoff?.totalApplications ?? (isDropoffLoading ? "--" : 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">All time applications received</p>
                </StatCard>

                {/* Active vs Closed Jobs KPI */}
                <StatCard title="Active vs closed jobs">
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="text-2xl font-semibold text-emerald-600">
                        {hiringTrendSummary?.activeJobs ?? (isHiringTrendLoading ? "--" : 0)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Active</p>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-500">
                        {hiringTrendSummary?.closedJobs ?? (isHiringTrendLoading ? "--" : 0)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Closed</p>
                    </div>
                  </div>
                </StatCard>

                {/* Overall Drop-off Rate KPI */}
                <StatCard title="Overall drop-off rate">
                  <div className="text-3xl font-semibold text-rose-500">
                    {totalDropoffRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidates dropping out across stages
                  </p>
                </StatCard>
              </div>

              {/* Middle Row - Hiring Trend Chart & Onboarding Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* Hiring Trend Chart */}
                <HiringTrend
                  dateRange={dateRange}
                  jobStatus={jobStatus}
                  companyIdOverride={companyId}
                  recruiterIdOverride={selectedRecruiterId}
                />

                {/* Onboarding Pipeline Snapshot */}
                <StatCard
                  title="Onboarding pipeline"
                  className="mt-0 !py-3 text-left lg:col-span-1">
                  <div className="space-y-4 h-[70%] relative">
                    <p className="text-xs font-semibold text-gray-400">
                      Recently onboarded candidates
                    </p>
                    <div className="flex flex-wrap gap-3  overflow-auto max-h-56">
                      {(onboarding?.candidates ?? []).slice(0, 12).map((cand) => (
                        <div
                          key={cand.applicationId}
                          className="flex items-center  justify-center px-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm min-w-[180px]">
                          <div className=" border-r-2 p-1 mr-2 text-center">
                            <p className="text-md font-semibold text-slate-700">
                              {cand.joinedDate
                                ? new Date(cand.joinedDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                  })
                                : "--"}
                            </p>
                            <p className="text-[8px] font-semibold text-gray-400">
                              {cand.joinedDate
                                ? new Date(cand.joinedDate).toLocaleDateString("en-IN", {
                                    month: "short",
                                  })
                                : "--"}
                            </p>
                          </div>
                          <div className="">
                            <p className="mt-1 text-sm capitalize font-medium text-slate-900 truncate">
                              {cand.applicantName || cand.applicantEmail}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {cand.jobTitle || "Job title not available"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isOnboardingLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="animate-spin text-slate-400 h-8 w-8" />
                      </div>
                    ) : !(onboarding?.candidates ?? []).length ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400">
                          No onboarded candidates in the selected period.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </StatCard>
              </div>

              {/* Bottom Row - Critical Drop-offs & Funnel Velocity */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {/* Critical Drop-off Stages Card */}
                <StatCard title="Critical drop-off stages" className="h-full text-left">
                  {/* Top Summary Stats */}
                  <div className="flex text-center items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Applications</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {dropoff?.totalApplications ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Drop-offs</p>
                      <p className="text-2xl font-bold text-rose-500">
                        {dropoff?.totalDropoffs ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Overall Drop-off Rate</p>
                      <p className="text-3xl font-bold text-rose-600">
                        {totalDropoffRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Drop-off Stages */}
                  <div className="space-y-4 max-h-[340px] overflow-y-auto no-scrl-web relative">
                    {dropoff?.dropoffByStage
                      .filter((stage) => stage.dropoffRate > 0) // Filter out 0% drop-off stages
                      .map((stage, index) => {
                        // Find the stage with highest drop-off rate
                        const maxDropoffRate = Math.max(
                          ...dropoff.dropoffByStage
                            .filter((s) => s.dropoffRate > 0)
                            .map((s) => s.dropoffRate)
                        );
                        const isHighestDropoff = stage.dropoffRate === maxDropoffRate;

                        return (
                          <div
                            key={stage.stage}
                            className={`relative rounded-lg p-3 ${
                              isHighestDropoff
                                ? "bg-rose-50 border-2 border-rose-300"
                                : "bg-slate-50 border border-slate-200"
                            }`}>
                            <div className="flex items-center justify-between mb-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm text-slate-800">
                                  {newDisplayStatus[stage.stage as keyof typeof newDisplayStatus] ||
                                    stage.stage}
                                </span>
                                {isHighestDropoff && (
                                  <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                                    HIGHEST
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <div className="text-right">
                                  <p className="text-xl font-bold text-rose-600">
                                    {stage.dropoffRate.toFixed(1)}%
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {stage.dropoffs} out of {stage.applicationsReached} Candidate
                                    Dropped
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative w-full h-2 bg-white rounded-full overflow-hidden">
                              <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                                  isHighestDropoff
                                    ? "bg-gradient-to-r from-yellow-500 to-rose-700"
                                    : "bg-gradient-to-r from-yellow-300 to-rose-500"
                                }`}
                                style={{ width: `${stage.dropoffRate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                    {isDropoffLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader className="animate-spin text-slate-400 h-8 w-8" />
                      </div>
                    ) : !dropoff?.dropoffByStage.filter((s) => s.dropoffRate > 0).length ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="text-slate-400 text-sm">
                          No drop-off analytics available for the selected range.
                        </div>
                      </div>
                    ) : null}
                  </div>
                </StatCard>

                {/* Funnel Velocity Chart */}
                <FunnelVelocity
                  companyId={companyId}
                  recruiterId={selectedRecruiterId}
                  dateRange={dateRange}
                  jobStatus={jobStatus}
                />
              </div>

              {/* Hiring Intelligence Table */}
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <HiringIntelligence companyIdOverride={companyId} dateRange={dateRange} />
              </div>

              {/* Evaluator Table */}
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <EvaluatorMatrix 
                  companyIdOverride={companyId} 
                  dateRange={dateRange} 
                  recruiterId={selectedRecruiterId}
                  firstName={selectedRecruiter?.firstName}
                  lastName={selectedRecruiter?.lastName}
                  />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <AgencyMatrix
                  companyIdOverride={companyId} 
                  dateRange={dateRange} 
                  recruiterId={selectedRecruiterId}
                  firstName={selectedRecruiter?.firstName}
                  lastName={selectedRecruiter?.lastName}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateHome;
