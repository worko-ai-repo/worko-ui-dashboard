import { newDisplayStatus } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { useAppContext } from "@Context/App.context";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { CursorPaginationApplicationDataParams } from "@Interfaces/CorporateServices.dto";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { TabType } from "@Utils/ApplicationButtonVisibility.utils";
import secureStorage from "@Utils/SecureStorage.utils";
import { toLower } from "lodash";
import React from "react";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { Loader } from "lucide-react";

type DateRange = "7d" | "30d" | "90d" | "180d";

// Status tracker component for showing dots based on application journey
const getStatusDot = (job: JobApplicationDetailsDto, targetStatus: JobApplicationStatusType) => {
  if (!job.statusTracker || job.statusTracker.length === 0) {
    return <div className="w-3 h-3 rounded-full bg-gray-200" />;
  }

  const currentStatus = job.status as JobApplicationStatusType;
  const statusTracker = job.statusTracker;

  // Check if there's an offer letter issue
  const hasOfferLetterIssue =
    job.offerLetterIssueRaisedDetails &&
    Array.isArray(job.offerLetterIssueRaisedDetails) &&
    job.offerLetterIssueRaisedDetails.length > 0;

  // Define the proper order of statuses
  const statusOrder: JobApplicationStatusType[] = [
    "APPLIED",
    "ACCEPTED",
    "CV_DOWNLOADED",
    "UNDER_EVALUATION",
    "PROCESSING_INTERVIEW",
    "INTERVIEW_DONE",
    "DOCUMENT_REQUESTED",
    "DOCUMENT_SUBMITTED",
    "DOCUMENT_VERIFIED",
    "OFFER_SENT",
    "OFFER_ACCEPTED",
    "HIRED",
    "JOINED",
  ];

  // Offer-related statuses that should show orange when there's an issue
  const offerRelatedStatuses: JobApplicationStatusType[] = ["OFFER_SENT", "OFFER_ACCEPTED"];

  const isRejected = currentStatus === "REJECTED";
  const isOnHold = currentStatus === "ON_HOLD";

  // Find special status entries
  const rejectionEntry = statusTracker.find((st) => st.newStatus === "REJECTED");
  const onHoldEntry = statusTracker.find((st) => st.newStatus === "ON_HOLD");

  // Helper function to format date as DD MMM YY
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    return `${day} ${month} ${year}`;
  };

  // Helper function to get date for a status (falls back to previous stage date if not found)
  const getDateForStatus = (
    targetStatus: JobApplicationStatusType,
    targetIndex: number
  ): string | null => {
    // Check if this status exists in tracker
    const statusEntry = statusTracker.find((st) => st.newStatus === targetStatus);
    if (statusEntry) {
      return formatDate(statusEntry.actionDate);
    }

    // If not found, look for the most recent previous status in the tracker
    for (let i = targetIndex - 1; i >= 0; i--) {
      const prevStatus = statusOrder[i];
      const prevEntry = statusTracker.find((st) => st.newStatus === prevStatus);
      if (prevEntry) {
        return formatDate(prevEntry.actionDate);
      }
    }

    // Fallback to createdAt if nothing found
    if (job.createdAt) {
      return formatDate(job.createdAt);
    }

    return null;
  };

  // Get the current status index and target status index
  const currentStatusIndex = statusOrder.indexOf(currentStatus);
  const targetStatusIndex = statusOrder.indexOf(targetStatus);

  // Check if this specific status exists in the tracker
  const statusEntry = statusTracker.find((st) => st.newStatus === targetStatus);

  // Determine color and date display
  let dotColor = "bg-gray-200";
  let tooltipText = `${newDisplayStatus[targetStatus]}`;
  let showDate = false;
  let dateText = "";

  // SPECIAL CASE: APPLIED should ALWAYS be green with createdAt date if applicant exists
  if (targetStatus === "APPLIED") {
    dotColor = "bg-green-500 shadow-lg shadow-green-500";
    // Use createdAt for APPLIED status
    const appliedDate = job.createdAt ? new Date(job.createdAt) : new Date();
    dateText = formatDate(appliedDate);
    showDate = true;
    tooltipText = `${newDisplayStatus[targetStatus]} - ${dateText}`;

    return (
      <div className="flex flex-col items-center gap-1 group">
        <div
          className={`w-3 h-3 rounded-full ${dotColor} transition-all duration-300`}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={tooltipText}
        />
        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">{dateText}</span>
      </div>
    );
  }

  // Handle rejection cases
  if (isRejected && rejectionEntry) {
    if (targetStatus === "REJECTED") {
      dateText = formatDate(rejectionEntry.actionDate);
      dotColor = "bg-red-500 shadow-lg shadow-red-500";
      tooltipText = `Rejected - ${dateText}`;
      showDate = true;
    } else if (targetStatusIndex < currentStatusIndex) {
      // All stages before rejection should be green
      dotColor = "bg-green-500 shadow-lg shadow-green-500";
      const foundDate = getDateForStatus(targetStatus, targetStatusIndex);
      if (foundDate) {
        dateText = foundDate;
        showDate = true;
        tooltipText = `${newDisplayStatus[targetStatus]} - ${dateText}`;
      }
    }
  }
  // Handle on-hold cases
  else if (isOnHold && onHoldEntry) {
    if (targetStatus === "ON_HOLD") {
      dateText = formatDate(onHoldEntry.actionDate);
      dotColor = "bg-yellow-500 shadow-lg shadow-yellow-500";
      tooltipText = `On Hold - ${dateText}`;
      showDate = true;
    } else if (targetStatusIndex < currentStatusIndex) {
      // All stages before on-hold should be green
      dotColor = "bg-green-500 shadow-lg shadow-green-500";
      const foundDate = getDateForStatus(targetStatus, targetStatusIndex);
      if (foundDate) {
        dateText = foundDate;
        showDate = true;
        tooltipText = `${newDisplayStatus[targetStatus]} - ${dateText}`;
      }
    }
  }
  // Handle active journey
  else {
    if (targetStatusIndex <= currentStatusIndex) {
      // This stage has been reached or passed
      // Check if it's an offer-related status with an issue
      if (hasOfferLetterIssue && offerRelatedStatuses.includes(targetStatus)) {
        dotColor = "bg-orange-500 shadow-lg shadow-orange-500";
        const foundDate = getDateForStatus(targetStatus, targetStatusIndex);
        if (foundDate) {
          dateText = foundDate;
          showDate = true;
          const issueDetails = job.offerLetterIssueRaisedDetails?.[0];
          const issueRemarks = issueDetails?.remarks
            ? ` - Issue: ${issueDetails.remarks}`
            : " - Offer Letter Issue Raised";
          tooltipText = `${newDisplayStatus[targetStatus]} - ${dateText}${issueRemarks}`;
        } else {
          tooltipText = `${newDisplayStatus[targetStatus]} - Offer Letter Issue`;
        }
      } else {
        // Normal green status
        dotColor = "bg-green-500 shadow-lg shadow-green-500";
        const foundDate = getDateForStatus(targetStatus, targetStatusIndex);
        if (foundDate) {
          dateText = foundDate;
          showDate = true;
          tooltipText = `${newDisplayStatus[targetStatus]} - ${dateText}`;
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div
        className={`w-3 h-3 rounded-full ${dotColor} transition-all duration-300`}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltipText}
      />
      {showDate && (
        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">{dateText}</span>
      )}
    </div>
  );
};

// Status Legend Component
const StatusLegend = () => {
  const [showLegend, setShowLegend] = React.useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
        onClick={() => setShowLegend(!showLegend)}
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Status Legend">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {showLegend && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowLegend(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-4 min-w-[250px]">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500" />
                <span className="text-xs text-slate-600">Stage Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500" />
                <span className="text-xs text-slate-600">Offer Letter Issue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500" />
                <span className="text-xs text-slate-600">On Hold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500" />
                <span className="text-xs text-slate-600">Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-xs text-slate-600">Not Started</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface HiringIntelligenceProps {
  companyIdOverride?: string;
  dateRange?: DateRange;
}

/**
 * Helper function to convert date range to fromDate/toDate timestamps
 */
const getDateRangeTimestamps = (dateRange: DateRange) => {
  const now = Date.now();
  const daysMap = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180,
  };

  const days = daysMap[dateRange];
  const fromDate = now - days * 24 * 60 * 60 * 1000;

  return {
    fromDate,
    toDate: now,
  };
};

const HiringIntelligence = ({ companyIdOverride, dateRange = "30d" }: HiringIntelligenceProps) => {
  const { userDetails } = useAppContext();

  const companyId = companyIdOverride;
  const userType =
    secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE) ?? "ADMIN";
  const { pageSize, setPageSize: handlePageSizeChange } = useUrlState<TabType>({
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 10,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

  // Convert date range to timestamps
  const { fromDate, toDate } = React.useMemo(() => getDateRangeTimestamps(dateRange), [dateRange]);

  const params: Omit<CursorPaginationApplicationDataParams, "lastKey"> = {
    userType: userType ?? undefined,
    pageSize: pageSize,
    companyId: companyId,
    sortOrder: "descending",
    includeInterviewDetails: true,
    fromDate,
    toDate,
  };

  const baseQueryKey = [
    "CorporateJobsApplicationQuery",
    userDetails?.companyId || "defaultCompanyId",
    JSON.stringify(params),
  ];

  const {
    data: jobsWithApplications,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
    currentPage,
  } = useCursorPagination<JobApplicationDetailsDto, CursorPaginationApplicationDataParams>({
    queryKey: baseQueryKey,
    queryFn: CorporateServiceObj.fetchApplications,
    baseParams: params,
    enabled: !!companyId && !!userType && userType.includes("CORPORATE") ? !!companyId : true,
  });

  // Reset pagination when date range changes
  React.useEffect(() => {
    reset();
  }, [dateRange, reset]);

  const topJobs = jobsWithApplications ?? [];
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedJobIds, setSelectedJobIds] = React.useState<string[]>([]);

  // Get unique jobs by jobId (removes duplicates)
  const uniqueJobs = React.useMemo(() => {
    const jobMap = new Map<string, JobApplicationDetailsDto>();
    topJobs.forEach((job) => {
      if (!jobMap.has(job.jobId)) {
        jobMap.set(job.jobId, job);
      }
    });
    return Array.from(jobMap.values());
  }, [topJobs]);

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const filteredJobs = uniqueJobs.filter((job) =>
    job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Display applications based on selected jobs
  const displayedJobs = React.useMemo(() => {
    if (selectedJobIds.length === 0) {
      return topJobs; // Show all applications when no job is selected
    }
    return topJobs.filter((job) => selectedJobIds.includes(job.jobId));
  }, [topJobs, selectedJobIds]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && target.closest(".dropdown-container") === null) {
      setDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Filter out "ALL" status and other non-standard statuses - in proper order
  const relevantStatuses: JobApplicationStatusType[] = [
    "APPLIED",
    "ACCEPTED",
    "CV_DOWNLOADED",
    "UNDER_EVALUATION",
    "PROCESSING_INTERVIEW",
    "INTERVIEW_DONE",
    "DOCUMENT_REQUESTED",
    "DOCUMENT_SUBMITTED",
    "DOCUMENT_VERIFIED",
    "OFFER_SENT",
    "OFFER_ACCEPTED",
    "HIRED",
    "JOINED",
  ];

  // Check if company is not selected (for admin users)
  if (!companyId) {
    return (
      <div>
        <StatCard title="Hiring Intelligence" className="text-left h-full">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-slate-600 font-medium mb-2">Please select a company</p>
              <p className="text-xs text-slate-400">
                Choose a company from the filters above to view hiring intelligence data
              </p>
            </div>
          </div>
        </StatCard>
      </div>
    );
  }

  return (
    <div>
      {/* Jobs with applications & critical drop-offs */}
      <StatCard title="Hiring Intelligence" className="text-left h-full">
        <div className="flex justify-between items-start mb-2">
          <label htmlFor="pageSize" className="text-xs mt-0 ml-0 text-slate-400">
            Comprehensive tracking for{" "}
            {selectedJobIds.length > 0
              ? `${selectedJobIds.length} selected position${selectedJobIds.length > 1 ? "s" : ""}`
              : "all positions"}
          </label>
          <StatusLegend />
        </div>
        {/** Chips to select from all positions or from a set of jobs with horizontal scroll and search dropdown */}
        <div className="relative flex gap-2 mt-2 mb-4">
          <div className="flex gap-2 max-w-[70%] overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <span
              className={`inline-flex min-w-fit items-center px-2 py-1 rounded-full text-xs cursor-pointer ${
                selectedJobIds.length === 0
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
              onClick={() => setSelectedJobIds([])}>
              All Positions
            </span>
            {uniqueJobs.slice(0, 5).map((job) => (
              <span
                key={job.jobId}
                className={`inline-flex min-w-fit items-center px-2 py-2 capitalize rounded-full text-xs cursor-pointer ${
                  selectedJobIds.includes(job.jobId)
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
                title={job.jobTitle || "—"}
                onClick={() => toggleJobSelection(job.jobId)}>
                {job.jobTitle?.length > 20
                  ? `${job.jobTitle.substring(0, 20)}...`
                  : job.jobTitle || "—"}
              </span>
            ))}
          </div>

          {/* Search dropdown */}
          <div className="relative inline-flex capitalize dropdown-container flex-1 max-w-[250px]">
            <input
              type="text"
              placeholder="Search positions..."
              className="w-full px-3 py-1 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />
            {dropdownOpen && filteredJobs.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                {filteredJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className={`px-4 py-2 min-w-fit text-nowrap text-sm cursor-pointer ${
                      selectedJobIds.includes(job.jobId)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                    title={job.jobTitle || "—"}
                    onClick={() => {
                      toggleJobSelection(job.jobId);
                      setSearchTerm("");
                      setDropdownOpen(false);
                    }}>
                    {job.jobTitle}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto -mx-2 relative">
          <div className="border max-h-[500px] overflow-auto border-slate-200 rounded-lg">
            <table className="min-w-full text-xs relative">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-blue-50 to-blue-50 shadow-sm">
                <tr className="text-left text-slate-700 border-b border-blue-200">
                  <th className="py-3 px-4 font-semibold sticky left-0 z-30 bg-blue-50 min-w-[200px] w-[200px] max-w-[200px]">
                    CANDIDATE NAME
                  </th>
                  {relevantStatuses.map((status) => (
                    <th
                      key={status}
                      className="py-3 px-4 font-semibold text-center min-w-[120px] w-[120px] max-w-[120px]"
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={newDisplayStatus[status]}>
                      <div className="truncate">{newDisplayStatus[status]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedJobs.map((job, index) => (
                  <tr
                    key={`${job.jobId}-${job.id}`}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}>
                    <td className="py-3 px-4 sticky  !bg-sky-100/50 backdrop-blur-sm left-0 z-10 min-w-[200px] w-[200px] max-w-[200px]">
                      <div
                        className="font-medium capitalize text-slate-800 truncate"
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={job.applicantDetails.name}>
                        {toLower(job.applicantDetails.name)}
                      </div>
                      <div
                        className="text-[11px] text-slate-400 capitalize truncate"
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={job.jobTitle}>
                        {toLower(job.jobTitle)}
                      </div>
                    </td>
                    {relevantStatuses.map((status) => (
                      <td
                        key={status}
                        className="py-3 px-4 text-center min-w-[120px] w-[120px] max-w-[120px]">
                        {getStatusDot(job, status)}
                      </td>
                    ))}
                  </tr>
                ))}
                {!displayedJobs.length && !queryIsJobsLoading && (
                  <tr>
                    <td
                      colSpan={relevantStatuses.length + 1}
                      className="py-8 text-center text-slate-400 text-sm">
                      No applications found for the selected positions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {queryIsJobsLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader className="animate-spin text-slate-400 h-8 w-8" />
            </div>
          )}

          {!queryIsJobsLoading && !displayedJobs.length && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <p className="text-xs text-slate-400">
                No applications found for the selected company.
              </p>
            </div>
          )}
        </div>
      </StatCard>
    </div>
  );
};

export default HiringIntelligence;
