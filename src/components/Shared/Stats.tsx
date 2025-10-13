import React from "react";
import { useQuery } from "@tanstack/react-query";
import httpServiceObj from "@Services/ApiHandler.service";
import {
  GlobalCountResponse,
  CandidateGlobalCount,
  EmployeeGlobalCount,
  CompanyJobGlobalCount,
  ReferralGlobalCount,
  ReferAndEarnGlobalCount,
  ApplicantGlobalCount,
  JobGlobalCount,
} from "@Interfaces/Counts.dto";

type DashboardPage =
  | "candidates"
  | "employees"
  | "corporateJobs"
  | "corporateApplicants"
  | "referrals"
  | "referr&earn"
  | "applicant"
  | "jobs";

interface Stat {
  label: string;
  value: number;
}

interface HeaderDetailsProps {
  pageType?: DashboardPage;
  companyId?: string;
  jobId?: string;
}

/**
 * Map global-level endpoints (Admin)
 */
const ENDPOINT_MAP: Record<Exclude<DashboardPage, "applicant" | "jobs">, string> = {
  candidates: "/counts/CANDIDATE/global-count",
  employees: "/counts/EMPLOYEE/global-count",
  corporateJobs: "/counts/COMPANY_JOB/global-count",
  corporateApplicants: "/counts/COMPANY_JOB/global-count",
  referrals: "/counts/REFERRAL/global-count",
  "referr&earn": "/counts/REFER_AND_EARN/global-count",
};

/**
 * Build dynamic endpoint based on the page type.
 * Handles both global and company-scoped pages.
 */
const buildEndpoint = (pageType: DashboardPage, companyId?: string, jobId?: string): string => {
  if (pageType === "applicant") {
    if (!companyId || !jobId)
      throw new Error("companyId and jobId are required for applicant counts");
    return `/counts/${companyId}/${jobId}/JOB_APPLICATION/company-job`;
  }

  if (pageType === "jobs") {
    if (!companyId) throw new Error("companyId is required for job-level counts");
    return `/counts/${companyId}/JOB_APPLICATION/company`;
  }

  return ENDPOINT_MAP[pageType];
};

/**
 * Fetch global or company-scoped counts
 */
const fetchCounts = async (
  pageType: DashboardPage,
  companyId?: string,
  jobId?: string
): Promise<GlobalCountResponse> => {
  const endpoint = buildEndpoint(pageType, companyId, jobId);
  const { response, status } = await httpServiceObj.get<GlobalCountResponse>(
    endpoint,
    true,
    {},
    false,
    "JOB"
  );

  if (status !== 200 || !response || !response) {
    throw new Error("Failed to fetch counts");
  }
  return response as GlobalCountResponse;
};

/**
 * Extract UI stats from different entity types
 */
const extractStats = (data: GlobalCountResponse): Stat[] => {
  switch (data.entityType) {
    case "CANDIDATE":
      return Object.entries((data as CandidateGlobalCount).candidateJobApplicationCounts).map(
        ([key, value]) => ({
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          value,
        })
      );

    case "EMPLOYEE":
      return Object.entries((data as EmployeeGlobalCount).employeeJobApplicationCounts).map(
        ([key, value]) => ({
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          value,
        })
      );

    case "COMPANY_JOB":
      return Object.entries((data as CompanyJobGlobalCount).companyJobApplicationCounts).map(
        ([key, value]) => ({
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          value,
        })
      );

    case "REFERRAL":
      return Object.entries((data as ReferralGlobalCount).referralCounts).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value,
      }));

    case "REFER_AND_EARN":
      return Object.entries((data as ReferAndEarnGlobalCount).referAndEarnJobApplicationCounts).map(
        ([key, value]) => ({
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          value,
        })
      );

    case "JOB_APPLICATION":
      const appData =
        (data as ApplicantGlobalCount).allJobApplicationCounts ||
        (data as JobGlobalCount).allJobApplicationCounts;
      return Object.entries(appData).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value,
      }));

    default:
      return [];
  }
};

const HeaderDetails: React.FC<HeaderDetailsProps> = ({
  pageType = "candidates",
  companyId,
  jobId,
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["counts", pageType, companyId, jobId],
    queryFn: () => fetchCounts(pageType, companyId, jobId),
    retry: 1,
    // enabled:
    //   pageType === "jobs" ? !!companyId : pageType === "applicant" ? !!companyId && !!jobId : true,
  });

  const stats: Stat[] = data
    ? extractStats(data)
    : [
        { label: "Total", value: 0 },
        { label: "Rejected", value: 0 },
        { label: "Processing Interview", value: 0 },
        { label: "Applied", value: 0 },
        { label: "Hired", value: 0 },
      ];

  return (
    <div className="flex flex-wrap gap-4 mt-4 mb-6">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px] max-w-[150px] max-h-[150px] animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))
      ) : isError ? (
        <p className="text-red-500">Failed to fetch counts</p>
      ) : (
        stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px] max-w-[150px] max-h-[150px]">
            <p className="text-sm text-[#64748B] text-nowrap">{stat.label}</p>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default HeaderDetails;
