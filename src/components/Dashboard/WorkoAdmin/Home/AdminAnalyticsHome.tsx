import { useMemo, useState } from "react";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import { useQuery } from "@tanstack/react-query";
import AnalyticsServiceObj from "@Services/Analytics.service";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import HiringTrend from "@Components/Shared/Home/HiringTrend";
import FunnelVelocity from "@Components/Shared/Home/FunnelVelocity";
import HiringIntelligence from "@Components/Shared/Home/HiringIntelligence";
import CompanyInput from "@Components/Shared/CompanyInput";
import {
  OnboardingPipelineResponse,
  CriticalDropoffResponse,
  HiringTrendResponse,
} from "@Interfaces/Analytics.dto";
import { ApiResponseDto, CorporateInvite } from "@Interfaces/CorporateDashboard.dto";
import { CompanyDto } from "@Interfaces/JobsAndCompany.dto";
import { newDisplayStatus } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { AdminAnalyticsHomeSkeleton } from "@Components/Loader/Skeleton/SkeletonLoader";
import { useAnalyticsUrlState } from "@Hooks/useAnalyticsUrlState.hook";
import { Loader } from "lucide-react";

type DateRange = "7d" | "30d" | "90d" | "180d";
type JobStatusFilter = "ALL" | "PUBLISHED";

/**
 * Admin Analytics Home Component
 * Displays platform-wide analytics dashboard for admin users with:
 * - Company and recruiter filters
 * - Cross-company hiring trends and KPIs
 * - Onboarding pipeline across companies
 * - Critical dropoff stages analysis
 * - Funnel velocity metrics
 * - Hiring intelligence table
 */
const AdminAnalyticsHome = () => {
  // Use analytics-specific URL state hook to persist filters in URL
  const { state, setCompany, setRecruiter, setDateRange, setJobStatus } = useAnalyticsUrlState();

  const selectedCompanyId = state.companyId || undefined;
  const selectedCompanyName = state.companyName || undefined;
  const selectedRecruiterId = state.recruiterId || undefined;
  const selectedRecruiterName = state.recruiterName || undefined;
  const dateRange = (state.dateRange || "30d") as DateRange;
  const jobStatus = (state.jobStatus || "ALL") as JobStatusFilter;
  const [hiringTrendSummary, setHiringTrendSummary] = useState<HiringTrendResponse | null>(null);
  // Fetch companies list for admin filter
  const { data: companiesResponse } = useQuery<ApiResponseDto<CompanyDto>>({
    queryKey: ["analyticsAdminCompanies"],
    queryFn: () =>
      AdminServiceObj.fetchCompanies({
        pageSize: 50,
      }),
  });

  const companies = companiesResponse?.data ?? [];

  // Fetch recruiters from invites (only ACCEPTED status) for the selected company
  const { data: invitesResponse } = useQuery<ApiResponseDto<CorporateInvite>>({
    queryKey: ["analyticsAdminRecruitersInvites", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: () =>
      CorporateServiceObj.fetchInvites({
        pageSize: 200,
        companyId: selectedCompanyId,
        sortOrder: "descending",
      }),
  });

  const recruiters = useMemo(
    () => (invitesResponse?.data ?? []).filter((inv) => inv.inviteStatus === "ACCEPTED"),
    [invitesResponse]
  );

  // Find selected company and recruiter objects for display
  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || !companies.length) return null;
    return companies.find((c) => c.id === selectedCompanyId || c.SK === selectedCompanyId) || null;
  }, [selectedCompanyId, companies]);

  const selectedRecruiter = useMemo(() => {
    if (!selectedRecruiterId || !recruiters.length) return null;
    return recruiters.find((r) => r.id === selectedRecruiterId) || null;
  }, [selectedRecruiterId, recruiters]);

  // Fetch onboarding pipeline data
  const { data: onboarding, isLoading: isOnboardingLoading } = useQuery<OnboardingPipelineResponse>(
    {
      queryKey: [
        "analyticsOnboardingAdmin",
        selectedCompanyId,
        selectedRecruiterId,
        dateRange,
        jobStatus,
      ],
      queryFn: () =>
        AnalyticsServiceObj.getOnboardingPipeline({
          companyId: selectedCompanyId,
          recruiterId: selectedRecruiterId,
          includeDetails: true,
          dateRange,
          jobStatus,
        }),
      enabled: !!selectedCompanyId, // Only fetch when a company is selected
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
    }
  );

  // Fetch critical dropoff analytics data
  const { data: dropoff, isLoading: isDropoffLoading } = useQuery<CriticalDropoffResponse>({
    queryKey: [
      "analyticsDropoffAdmin",
      selectedCompanyId,
      selectedRecruiterId,
      dateRange,
      jobStatus,
    ],
    queryFn: () =>
      AnalyticsServiceObj.getDropoff({
        companyId: selectedCompanyId,
        recruiterId: selectedRecruiterId,
        dateRange,
        jobStatus,
        topN: 5,
      }),
    enabled: !!selectedCompanyId, // Only fetch when a company is selected
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
  });

  const totalDropoffRate = dropoff?.overallDropoffRate ?? 0;

  // Show skeleton loader while initial data is loading (only when company is selected)
  const isLoading = isOnboardingLoading || isDropoffLoading;

  // Show skeleton loader while data is loading
  if (selectedCompanyId && isLoading && !hiringTrendSummary && !onboarding && !dropoff) {
    return <AdminAnalyticsHomeSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-10 justify-between">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col w-full gap-4 justify-start">
          {/* Filters Section - Company, Recruiter, Date range, and Job status filters */}
          <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex-shrink-0 text-left">
              <p className="text-sm font-semibold text-slate-700">Platform analytics overview</p>
              <p className="text-xs text-slate-400">
                {selectedRecruiterName && selectedCompanyName
                  ? `Showing results for ${selectedRecruiterName} at ${selectedCompanyName}`
                  : selectedCompanyName
                  ? `Showing results for ${selectedCompanyName}`
                  : "Cross-company insights with company & recruiter filters"}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4 text-xs">
              {/* Company search using existing CompanyInput component */}
              <div className="flex flex-col min-w-[240px]">
                <label className="text-slate-500 mb-1.5 text-left">Company</label>
                {selectedCompanyId && selectedCompanyName ? (
                  // Show selected company with clear button
                  <div className="relative">
                    <div className="input_primary bg-gray-100 w-full px-4 py-3 pl-14 text-sm border-none flex items-center justify-between">
                      <span className="text-slate-700 font-medium truncate">
                        {selectedCompanyName}
                      </span>
                      <button
                        onClick={() => {
                          setCompany(undefined, undefined);
                        }}
                        className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <CompanyInput
                    errors={{}}
                    setValue={() => {}}
                    clearErrors={() => {}}
                    setCompanyName={(company: any) => {
                      if (company && company.SK) {
                        const id = company.id ?? company.SK;
                        const name = company.name || "";
                        setCompany(id, name);
                      } else {
                        setCompany(undefined, undefined);
                      }
                    }}
                    isOtpSent={false}
                    showRequestCompany={false}
                  />
                )}
              </div>

              {/* Recruiter dropdown fed from invites; disabled until company selected */}
              <div className="flex flex-col min-w-[200px]">
                <label className="text-slate-500 mb-1.5 text-left">Recruiter</label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs h-[44px] cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                  value={selectedRecruiterId ?? ""}
                  onChange={(e) => {
                    const recruiterId = e.target.value || undefined;
                    const recruiter = recruiters.find((r) => r.id === recruiterId);
                    setRecruiter(
                      recruiterId,
                      recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : undefined
                    );
                  }}
                  disabled={!selectedCompanyId}>
                  <option value="">All recruiters</option>
                  {recruiters.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.firstName} {inv.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range filter */}
              <div className="flex flex-col">
                <label className="text-slate-500 mb-1.5 text-left">Date range</label>
                <div className="flex gap-2">
                  {(["7d", "30d", "90d", "180d"] as DateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap ${
                        dateRange === range
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}>
                      {range === "7d" && "7 days"}
                      {range === "30d" && "30 days"}
                      {range === "90d" && "90 days"}
                      {range === "180d" && "180 days"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job status filter */}
              <div className="flex flex-col">
                <label className="text-slate-500 mb-1.5 text-left">Job status</label>
                <div className="flex gap-2">
                  {(["ALL", "PUBLISHED"] as JobStatusFilter[]).map((statusValue) => (
                    <button
                      key={statusValue}
                      onClick={() => setJobStatus(statusValue)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap ${
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
            <div className="mx-auto space-y-8">
              {/* Top Row - KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total jobs">
                  <div className="text-3xl font-semibold text-slate-800">
                    {hiringTrendSummary?.totalJobs ?? "--"}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Across all companies in scope</p>
                </StatCard>
                <StatCard title="Total applications">
                  <div className="text-3xl font-semibold text-slate-800">
                    {dropoff?.totalApplications ?? (isDropoffLoading ? "--" : 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">All time applications received</p>
                </StatCard>
                <StatCard title="Active vs closed jobs">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-emerald-600">
                        {hiringTrendSummary?.activeJobs ?? "--"}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Active</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-slate-500">
                        {hiringTrendSummary?.closedJobs ?? "--"}
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

              {/* Middle Row - Hiring Trend Chart & Onboarding Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Trend Chart */}
                {!selectedCompanyId ? (
                  <StatCard title="Hiring trend" className="text-left">
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 mx-auto text-slate-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <p className="text-slate-600 font-medium mb-2">Please select a company</p>
                        <p className="text-xs text-slate-400">
                          Choose a company from the filters above to view hiring trend data
                        </p>
                      </div>
                    </div>
                  </StatCard>
                ) : (
                  <HiringTrend
                    dateRange={dateRange}
                    jobStatus={jobStatus}
                    companyIdOverride={selectedCompanyId}
                    recruiterIdOverride={selectedRecruiterId}
                    setHiringTrendSummary={setHiringTrendSummary}
                  />
                )}

                {/* Onboarding Pipeline Snapshot */}
                {!selectedCompanyId ? (
                  <StatCard
                    title="Onboarding pipeline"
                    className="mt-0 !py-3 text-left lg:col-span-1">
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 mx-auto text-slate-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-slate-600 font-medium mb-2">Please select a company</p>
                        <p className="text-xs text-slate-400">
                          Choose a company from the filters above to view onboarding pipeline
                        </p>
                      </div>
                    </div>
                  </StatCard>
                ) : (
                  <StatCard
                    title="Onboarding pipeline"
                    className="mt-0 !py-3 text-left lg:col-span-1">
                    <div className="space-y-4 h-[70%] relative">
                      <p className="text-xs font-semibold text-gray-400">
                        Recently onboarded candidates
                      </p>
                      <div className="flex flex-wrap gap-3 overflow-auto max-h-56">
                        {(onboarding?.candidates ?? []).slice(0, 12).map((cand) => (
                          <div
                            key={cand.applicationId}
                            className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm min-w-[180px]">
                            <div className="border-r-2 p-1 mr-2 text-center ">
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
                )}
              </div>

              {/* Bottom Row - Critical Drop-offs & Funnel Velocity */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Critical Drop-off Stages Card */}
                {!selectedCompanyId ? (
                  <StatCard title="Critical drop-off stages" className="h-full text-left">
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 mx-auto text-slate-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                          />
                        </svg>
                        <p className="text-slate-600 font-medium mb-2">Please select a company</p>
                        <p className="text-xs text-slate-400">
                          Choose a company from the filters above to view drop-off analytics
                        </p>
                      </div>
                    </div>
                  </StatCard>
                ) : (
                  <StatCard title="Critical drop-off stages" className="h-full text-left">
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
                        .filter((stage) => stage.dropoffRate > 0)
                        .map((stage) => {
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
                                    {newDisplayStatus[
                                      stage.stage as keyof typeof newDisplayStatus
                                    ] || stage.stage}
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

                      {!dropoff?.dropoffByStage.filter((s) => s.dropoffRate > 0).length && (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          No drop-off analytics available for the selected range.
                        </div>
                      )}
                    </div>
                  </StatCard>
                )}

                {/* Funnel Velocity Chart */}
                {!selectedCompanyId ? (
                  <StatCard
                    title="Funnel Velocity (Avg. Time Per Stage)"
                    className="h-full text-left">
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 mx-auto text-slate-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-slate-600 font-medium mb-2">Please select a company</p>
                        <p className="text-xs text-slate-400">
                          Choose a company from the filters above to view funnel velocity data
                        </p>
                      </div>
                    </div>
                  </StatCard>
                ) : (
                  <FunnelVelocity
                    companyId={selectedCompanyId}
                    recruiterId={selectedRecruiterId}
                    dateRange={dateRange}
                    jobStatus={jobStatus}
                  />
                )}
              </div>

              {/* Hiring Intelligence Table */}
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <HiringIntelligence companyIdOverride={selectedCompanyId} dateRange={dateRange} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsHome;
