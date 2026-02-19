import { newDisplayStatus } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { useAppContext } from "@Context/App.context";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { OnboardingPipelineResponse } from "@Interfaces/Analytics.dto";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { CursorPaginationApplicationDataParams } from "@Interfaces/CorporateServices.dto";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import AnalyticsServiceObj from "@Services/Analytics.service";
import { useQuery } from "@tanstack/react-query";
import { TabType } from "@Utils/ApplicationButtonVisibility.utils";
import secureStorage from "@Utils/SecureStorage.utils";
import { toLower } from "lodash";
import React from "react";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";

// Status tracker component for showing dots based on application journey
const getStatusDot = (job: JobApplicationDetailsDto, targetStatus: JobApplicationStatusType) => {
  if (!job.statusTracker || job.statusTracker.length === 0) {
    return <div className="w-3 h-3 rounded-full bg-gray-200" />;
  }

  const currentStatus = job.status as JobApplicationStatusType;
  const statusTracker = job.statusTracker;

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

  const isRejected = currentStatus === "REJECTED";
  const isOnHold = currentStatus === "ON_HOLD";

  // Find special status entries
  const rejectionEntry = statusTracker.find((st) => st.newStatus === "REJECTED");
  const onHoldEntry = statusTracker.find((st) => st.newStatus === "ON_HOLD");

  // ALWAYS find APPLIED date as Day 0 baseline - this is the start of the journey
  // If APPLIED is not in tracker, use the first entry's date OR createdAt
  const appliedEntry = statusTracker.find((st) => st.newStatus === "APPLIED");
  const firstDate = appliedEntry
    ? new Date(appliedEntry.actionDate)
    : statusTracker.length > 0
    ? new Date(statusTracker[0].actionDate)
    : job.createdAt
    ? new Date(job.createdAt)
    : new Date();

  const getDayNumber = (status: JobApplicationStatusType) => {
    // Return the stage index as the day number
    const stageIndex = statusOrder.indexOf(status);
    return stageIndex >= 0 ? stageIndex : 0;
  };

  // Get the current status index and target status index
  const currentStatusIndex = statusOrder.indexOf(currentStatus);
  const targetStatusIndex = statusOrder.indexOf(targetStatus);

  // Check if this specific status exists in the tracker
  const statusEntry = statusTracker.find((st) => st.newStatus === targetStatus);

  // Determine color and day display
  let dotColor = "bg-gray-200";
  let tooltipText = `${newDisplayStatus[targetStatus]}`;
  let showDay = false;
  let dayNum = 0;

  // SPECIAL CASE: APPLIED should ALWAYS be green with Day 0 if applicant exists
  if (targetStatus === "APPLIED") {
    dotColor = "bg-green-500 shadow-lg shadow-green-500";
    dayNum = 0;
    showDay = true;
    tooltipText = `${newDisplayStatus[targetStatus]} - Day 0`;

    return (
      <div className="flex flex-col items-center gap-1 group">
        <div
          className={`w-3 h-3 rounded-full ${dotColor} transition-all duration-300`}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={tooltipText}
        />
        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">Day {dayNum}</span>
      </div>
    );
  }

  // Handle rejection cases
  if (isRejected && rejectionEntry) {
    if (targetStatus === "REJECTED") {
      dayNum = getDayNumber(currentStatus);
      dotColor = "bg-red-500 shadow-lg shadow-red-500";
      tooltipText = `Rejected - Day ${dayNum}`;
      showDay = true;
    } else if (targetStatusIndex < currentStatusIndex) {
      // All stages before rejection should be green
      dotColor = "bg-green-500 shadow-lg shadow-green-500";
      if (statusEntry) {
        dayNum = getDayNumber(targetStatus);
        showDay = true;
        tooltipText = `${newDisplayStatus[targetStatus]} - Day ${dayNum}`;
      }
    }
  }
  // Handle on-hold cases
  else if (isOnHold && onHoldEntry) {
    if (targetStatus === "ON_HOLD") {
      dayNum = getDayNumber(currentStatus);
      dotColor = "bg-yellow-500 shadow-lg shadow-yellow-500";
      tooltipText = `On Hold - Day ${dayNum}`;
      showDay = true;
    } else if (targetStatusIndex < currentStatusIndex) {
      // All stages before on-hold should be green
      dotColor = "bg-green-500 shadow-lg shadow-green-500";
      if (statusEntry) {
        dayNum = getDayNumber(targetStatus);
        showDay = true;
        tooltipText = `${newDisplayStatus[targetStatus]} - Day ${dayNum}`;
      }
    }
  }
  // Handle active journey
  else {
    if (targetStatusIndex <= currentStatusIndex) {
      // This stage has been reached or passed - ALWAYS show as green
      dotColor = "bg-green-500 shadow-lg shadow-green-500";

      if (statusEntry) {
        // If this status exists in tracker, show its stage day number
        dayNum = getDayNumber(targetStatus);
        showDay = true;
        tooltipText = `${newDisplayStatus[targetStatus]} - Day ${dayNum}`;
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
      {showDay && (
        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">Day {dayNum}</span>
      )}
    </div>
  );
};

const HiringIntelligence = () => {
  const { userDetails } = useAppContext();
  const companyId = userDetails?.companyId;
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);
  const { pageSize, setPageSize: handlePageSizeChange } = useUrlState<TabType>({
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 10,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

  const params: Omit<CursorPaginationApplicationDataParams, "lastKey"> = {
    userType: userType ?? undefined,
    pageSize: pageSize,
    sortOrder: "descending",
    includeInterviewDetails: true,
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
    enabled: !!userDetails?.companyId && !!userType,
  });

  const topJobs = jobsWithApplications ?? [];
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedJobIds, setSelectedJobIds] = React.useState<string[]>([]);

  const { data: onboarding } = useQuery<OnboardingPipelineResponse>({
    queryKey: ["analyticsOnboardingCorporate", companyId],
    queryFn: () =>
      AnalyticsServiceObj.getOnboardingPipeline({
        companyId,
        includeDetails: false,
      }),
    enabled: false,
  });

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

  return (
    <div>
      {/* Jobs with applications & critical drop-offs */}
      <StatCard title="Hiring Intelligence" className="text-left h-full">
        <label htmlFor="pageSize" className="text-xs mt-0 ml-0 text-slate-400">
          Comprehensive tracking for{" "}
          {selectedJobIds.length > 0
            ? `${selectedJobIds.length} selected position${selectedJobIds.length > 1 ? "s" : ""}`
            : "all positions"}
        </label>
        {/** Chips to select from all positions or from a set of jobs with horizontal scroll and dropdown for more options */}
        <div className="relative mt-2 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <span
              className={`inline-flex min-w-fit items-center px-2 py-1 rounded-full text-xs cursor-pointer ${
                selectedJobIds.length === 0
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
              onClick={() => setSelectedJobIds([])}>
              All Positions
            </span>
            {uniqueJobs.map((job) => (
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
          <div className="relative inline-block capitalize dropdown-container">
            <button
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-500 cursor-pointer hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setDropdownOpen((prev) => !prev)}>
              More
            </button>
            {dropdownOpen && (
              <div className="absolute z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 border-b border-slate-200 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {filteredJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className={`px-4 py-2  min-w-fit text-nowrap text-sm cursor-pointer ${
                      selectedJobIds.includes(job.jobId)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                    title={job.jobTitle || "—"}
                    onClick={() => toggleJobSelection(job.jobId)}>
                    {job.jobTitle}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto -mx-2">
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
                {!displayedJobs.length && (
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
        </div>
      </StatCard>
    </div>
  );
};

export default HiringIntelligence;