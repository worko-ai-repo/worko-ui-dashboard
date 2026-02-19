import { useMemo, useState } from "react";
import HeaderDetails from "../../../Shared/Stats";

import { StatCard } from "./StatCard";
import { BarChart } from "@Components/Charts/LineGraph";
import { DonutChart } from "@Components/Charts/DonughtChart";
import { ChartLegend } from "./ChartLegend";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@Context/App.context";
import AnalyticsServiceObj from "@Services/Analytics.service";
import {
  AnalyticsHomePageResponse,
  JobWithApplicationsItem,
  OnboardingPipelineResponse,
  CriticalDropoffResponse,
} from "@Interfaces/Analytics.dto";
import {
  CorporateHomeChartDataDto,
  CorporateHomePieChartDataDto,
} from "@Interfaces/CorporateHomeDto";
import { JobApplicationStatusEnum } from "@Enums/JobAndApplication.enum";
import HiringIntelligence from "@Components/Shared/Home/HiringIntelligence";
import FunnelVelocity from "@Components/Shared/Home/FunnelVelocity";
import HiringTrend from "@Components/Shared/Home/HiringTrend";
import { newDisplayStatus } from "../Applicants/ApplicantsTable";

type DateRange = "7d" | "30d" | "90d" | "180d";
type JobStatusFilter = "ALL" | "PUBLISHED";

const STATUS_COLORS: Record<JobApplicationStatusEnum, string> = {
  [JobApplicationStatusEnum.APPLIED]: "#3B82F6",
  [JobApplicationStatusEnum.ACCEPTED]: "#22C55E",
  [JobApplicationStatusEnum.UNDER_EVALUATION]: "#FACC15",
  [JobApplicationStatusEnum.PROCESSING_INTERVIEW]: "#A855F7",
  [JobApplicationStatusEnum.INTERVIEW_DONE]: "#6366F1",
  [JobApplicationStatusEnum.HIRING_IN_PROCESS]: "#0EA5E9",
  [JobApplicationStatusEnum.DOCUMENT_REQUESTED]: "#F97316",
  [JobApplicationStatusEnum.DOCUMENT_SUBMITTED]: "#10B981",
  [JobApplicationStatusEnum.DOCUMENT_VERIFIED]: "#14B8A6",
  [JobApplicationStatusEnum.OFFER_SENT]: "#F59E0B",
  [JobApplicationStatusEnum.HIRED]: "#16A34A",
  [JobApplicationStatusEnum.JOINED]: "#22C55E",
  [JobApplicationStatusEnum.REJECTED]: "#EF4444",
  [JobApplicationStatusEnum.ON_HOLD]: "#9CA3AF",
  [JobApplicationStatusEnum.CV_DOWNLOADED]: "#4B5563",
  [JobApplicationStatusEnum.DOCUMENT_ADDITIONAL_REQUESTED]: "#F97316",
  [JobApplicationStatusEnum.DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED]: "#10B981",
  [JobApplicationStatusEnum.DOCUMENT_REVISION_REQUESTED]: "#FB923C",
  [JobApplicationStatusEnum.DOCUMENT_REVISION_REQUEST_SUBMITTED]: "#4ADE80",
  [JobApplicationStatusEnum.OFFER_ISSUE_RAISED]: "#E11D48",
  [JobApplicationStatusEnum.REVISED_OFFER_SENT]: "#0EA5E9",
  [JobApplicationStatusEnum.REVISED_LETTER]: "#38BDF8",
  [JobApplicationStatusEnum.OFFER_ACCEPTED]: "#22C55E",
  [JobApplicationStatusEnum.AWAITING]: "#6B7280",
  [JobApplicationStatusEnum.ALL]: "#6B7280",
};

const CorporateHome = () => {
  const { userDetails } = useAppContext();
  const companyId = userDetails?.companyId;

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [jobStatus, setJobStatus] = useState<JobStatusFilter>("ALL");

  const {
    data: analyticsHome,
    isLoading: isHomeLoading,
  } = useQuery<AnalyticsHomePageResponse>({
    queryKey: ["analyticsHomeCorporate", companyId, dateRange, jobStatus],
    queryFn: () =>
      AnalyticsServiceObj.getHome({
        companyId,
        dateRange,
        jobStatus,
      }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: onboarding } = useQuery<OnboardingPipelineResponse>({
    queryKey: ["analyticsOnboardingCorporate", companyId, dateRange, jobStatus],
    queryFn: () =>
      AnalyticsServiceObj.getOnboardingPipeline({
        companyId,
        includeDetails: true,
        dateRange,
        jobStatus,
      }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: dropoff } = useQuery<CriticalDropoffResponse>({
    queryKey: ["analyticsDropoffCorporate", companyId, dateRange, jobStatus],
    queryFn: () =>
      AnalyticsServiceObj.getDropoff({
        companyId,
        dateRange,
        jobStatus,
        topN: 5,
      }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const applicationsStatusChartData: CorporateHomePieChartDataDto[] =
    useMemo(() => {
      if (!analyticsHome) return [];
      const entries = Object.entries(analyticsHome.applicationsByStatus || {});

      return entries
        .filter(([, value]) => value > 0)
        .map(([status, value]) => {
          const typedStatus = status as JobApplicationStatusEnum;
          return {
            label: typedStatus,
            value,
            color: STATUS_COLORS[typedStatus] || "#3B82F6",
          };
        });
    }, [analyticsHome]);

  const recentActivityChartData: CorporateHomeChartDataDto[] = useMemo(() => {
    if (!analyticsHome) return [];

    return [
      {
        year: "Jobs (7d)",
        value: analyticsHome.recentActivity.jobsPostedLast7Days,
      },
      {
        year: "Apps (7d)",
        value: analyticsHome.recentActivity.applicationsLast7Days,
      },
      {
        year: "Apps (30d)",
        value: analyticsHome.recentActivity.applicationsLast30Days,
      },
    ];
  }, [analyticsHome]);

  const totalDropoffRate = dropoff?.overallDropoffRate ?? 0;

  return (
    <div className="flex flex-col gap-4 lg:gap-10 justify-between">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col w-full gap-4 justify-start">
          {/* <HeaderDetails /> */}

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Analytics overview
              </p>
              <p className="text-xs text-slate-400">
                Job & application insights for your company
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 mr-1">Date range:</span>
                {(["7d", "30d", "90d", "180d"] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      dateRange === range
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {range === "7d" && "Last 7 days"}
                    {range === "30d" && "Last 30 days"}
                    {range === "90d" && "Last 90 days"}
                    {range === "180d" && "Last 180 days"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 mr-1">Job status:</span>
                {(["ALL", "PUBLISHED"] as JobStatusFilter[]).map((statusValue) => (
                  <button
                    key={statusValue}
                    onClick={() => setJobStatus(statusValue)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      jobStatus === statusValue
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {statusValue === "ALL" && "All jobs"}
                    {statusValue === "PUBLISHED" && "Published only"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-screen">
            <div className="mx-auto space-y-8">
              {/* Top Row - KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total jobs">
                  <div className="text-3xl font-semibold text-slate-800">
                    {analyticsHome?.totalJobs ?? (isHomeLoading ? "--" : 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Across all recruiters in your company
                  </p>
                </StatCard>
                <StatCard title="Total applications">
                  <div className="text-3xl font-semibold text-slate-800">
                    {analyticsHome?.totalApplications ??
                      (isHomeLoading ? "--" : 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    All time applications received
                  </p>
                </StatCard>
                <StatCard title="Active vs closed jobs">
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="text-2xl font-semibold text-emerald-600">
                        {analyticsHome?.activeJobs ??
                          (isHomeLoading ? "--" : 0)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Active</p>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-500">
                        {analyticsHome?.closedJobs ??
                          (isHomeLoading ? "--" : 0)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Closed</p>
                    </div>
                  </div>
                </StatCard>
                <StatCard title="Overall drop-off rate">
                  <div className="text-3xl font-semibold text-rose-500">
                    {totalDropoffRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidates dropping out across stages
                  </p>
                </StatCard>
              </div>

              {/* Middle Row - Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                <HiringTrend dateRange={dateRange} jobStatus={jobStatus} />

                {/* Onboarding pipeline snapshot */}
                <StatCard title="Onboarding pipeline" className="mt-0  !py-3 text-left lg:col-span-1">

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400">
                    Recently onboarded candidates
                  </p>
                  <div className="flex flex-wrap gap-3  overflow-auto max-h-56">
                    {(onboarding?.candidates ?? []).slice(0,12).map((cand) => (
                      <div
                        key={cand.applicationId}
                        className="flex items-center  justify-center px-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm min-w-[180px]"
                      >
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
                                month: "short"
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

                    {!(onboarding?.candidates ?? []).length && (
                      <p className="text-xs text-slate-400">
                        No onboarded candidates in the selected period.
                      </p>
                    )}
                  </div>
                </div>
                </StatCard>
              </div>
              
              <div className="grid grid-cols-1  xl:grid-cols-2 gap-6">
                              {/* Jobs with applications & critical drop-offs */}
             
                <StatCard
                  title="Critical drop-off stages"
                  className="h-full text-left"
                >
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
                  <div className="space-y-4 max-h-[340px] overflow-y-auto no-scrl-web">
                    {dropoff?.dropoffByStage
                      .filter((stage) => stage.dropoffRate > 0) // Filter out 0% drop-off stages
                      .map((stage, index) => {
                      // Find the stage with highest drop-off rate
                      const maxDropoffRate = Math.max(
                        ...dropoff.dropoffByStage.filter((s) => s.dropoffRate > 0).map(s => s.dropoffRate)
                      );
                      const isHighestDropoff = stage.dropoffRate === maxDropoffRate;

                      return (
                        <div
                          key={stage.stage}
                          className={`relative rounded-lg p-3 ${
                            isHighestDropoff
                              ? 'bg-rose-50 border-2 border-rose-300'
                              : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm text-slate-800">
                                {newDisplayStatus[stage.stage as JobApplicationStatusEnum] || stage.stage}
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
                                  {stage.dropoffs} out of {stage.applicationsReached} Candidate Dropped
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="relative w-full h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                                isHighestDropoff
                                  ? 'bg-gradient-to-r from-yellow-500 to-rose-700'
                                  : 'bg-gradient-to-r from-yellow-300 to-rose-500'
                              }`}
                              style={{ width: `${stage.dropoffRate}%` }}
                            />
                          </div>
                        
                        </div>
                      );
                    })}

                    {!dropoff?.dropoffByStage.filter((s) => s.dropoffRate > 0).length && (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        No drop-off analytics available for the selected range.
                      </div>
                    )}
                  </div>
                </StatCard>
              
                <FunnelVelocity dateRange={dateRange} jobStatus={jobStatus} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <HiringIntelligence />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateHome;
