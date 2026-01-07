import { useEffect, useState, useMemo, useRef } from "react";
import ApplicationTable from "./ApplicantsTable";
import HeaderDetails from "../../../Shared/Stats";
import SearchBar from "../../../Shared/SearchBar";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { useAppContext } from "@Context/App.context";
import SkeletonLoader from "../../../Shared/SkeletonLoader";
import { clipboard } from "@Assets";
import { toast } from "react-toastify";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationApplicationDataAdminParams } from "@Interfaces/AdminServices.dto";
import GenericDropdown from "@Components/Shared/DropDown/GenericDropdown";
import {
  BulkJobApplicationUpdateItem,
  BulkJobApplicationUpdatePayloadItem,
} from "@Interfaces/CorporateServices.dto";
import { useListSelection } from "@Hooks/useListSelection.hook";
import AdminServiceObj from "../Services/Admin.service";
import { EvaluatorFormProps } from "@Components/Shared/ApplicantsPage/EvaluatorForm";
import BulkStatusDropDown from "@Components/Shared/ApplicantsPage/BulkStatusDropDown";
import ResponseEvaluation from "@Components/Shared/ApplicantsPage/ViewEvaluation";
import { useParams } from "react-router-dom";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { checkIsWorkoJobFromSelected } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { getToastOptions } from "@Utils/Toast.utils";
import { TabType } from "@Utils/ApplicationButtonVisibility.utils";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApplicantFilters, {
  ApplicantFilterValues,
} from "@Components/Shared/ApplicantsPage/ApplicantFilters";
import { filterApplicants } from "@Utils/ApplicantFilter.utils";

export interface JobApplicationUpdatePayloadDto {
  applicantName: string;
  emailId: string;
  status: JobApplicationStatusType;
  userId: string;
  userType?: string;
}

const tabs = ["All", "Hired", "Joined"] as const;

export interface ApplicationListSelectionDto {
  selectedRows: BulkJobApplicationUpdateItem[];
  toggleRow: (item: JobApplicationDetailsDto) => void;
  toggleSelectAll: (items: JobApplicationDetailsDto[]) => void;
  getAllSelected: (items: JobApplicationDetailsDto[]) => boolean;
  reset: () => void;
}

interface ApplicantsProps {
  isAllApplicants?: boolean;
}

const Applicants: React.FC<ApplicantsProps> = ({ isAllApplicants = false }) => {
  const { userDetails } = useAppContext();
  const queryClient = useQueryClient();
  const currentPageIndexRef = useRef(0);

  // Initialize apiStatus based on activeTab to prevent double API calls
  const getInitialApiStatus = (tab: TabType): JobApplicationStatusType | undefined => {
    switch (tab) {
      case "All":
        return undefined;
      case "Hired":
        return "HIRING_IN_PROCESS";
      case "Joined":
        return "JOINED";
      default:
        return undefined;
    }
  };

  const {
    activeTab,
    setActiveTab: setActiveTabUrl,
    searchText: searchBarText,
    setSearchText: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
  } = useUrlState<TabType>({
    tab: {
      defaultValue: "All",
      validValues: [...tabs] as TabType[],
    },
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: isAllApplicants ? 25 : 200,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

  // Custom tab change handler that updates both tab and status together
  const handleTabChange = (tab: TabType) => {
    const newStatus = getInitialApiStatus(tab);
    setApiStatus(newStatus);
    setActiveTabUrl(tab);
  };

  const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
  const [EvaluatorFormProps, setEvaluatorFormProps] = useState<EvaluatorFormProps | null>(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
  const { id: jobId } = useParams<{ id: string }>();
  const [apiStatus, setApiStatus] = useState<JobApplicationStatusType | undefined>(
    getInitialApiStatus(activeTab)
  );

  // Add filter state
  const [filters, setFilters] = useState<ApplicantFilterValues>({});

  const ListSelection: ApplicationListSelectionDto = useListSelection({
    limit: 30,
    mapFn: (application: JobApplicationDetailsDto): BulkJobApplicationUpdateItem => ({
      id: application.id,
      emailId: application.applicantDetails.email,
      jobApplicationId: application.id,
      status: application.status,
      oldStatus: application.status,
      userType: "ADMIN",
      applicantName: application.applicantDetails.name,
      oldStatusTracker: application.statusTracker ?? [],
      applicantUserId: application.applicantDetails.userId,
      cvAwsS3ResourceType: application.applicantDetails.cvAwsS3ResourceType,
      candidateParsedCvId: application.candidateParsedCvId ?? "",
    }),
    keySelector: (application: BulkJobApplicationUpdateItem) => application.jobApplicationId,
  });

  const params: Omit<CursorPaginationApplicationDataAdminParams, "lastKey"> = {
    ...(apiStatus !== undefined ? { status: apiStatus } : {}),
    ...(searchBarText?.trim() ? { searchText: searchBarText } : {}),
    userType: "ADMIN",
    pageSize: pageSize,
    sortOrder: "descending",
    includeInterviewDetails: true,
    ...(isAllApplicants ? {} : { jobId: jobId ?? undefined }),
  };

  // Base query key without the dynamic currentPageIndex
  const baseQueryKey = [
    "AdminJobsApplicationQuery",
    activeTab,
    searchBarText || "",
    JSON.stringify(params),
    isAllApplicants,
  ];

  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
    currentPage,
  } = useCursorPagination<JobApplicationDetailsDto, CursorPaginationApplicationDataAdminParams>({
    queryKey: baseQueryKey,
    queryFn: AdminServiceObj.fetchApplications,
    baseParams: params,
    enabled: isAllApplicants ? true : !!jobId,
  });

  // Update current page index ref whenever page changes
  useEffect(() => {
    currentPageIndexRef.current = currentPage - 1;
  }, [currentPage]);

  // Apply filters to the data locally
  const filteredData = useMemo(() => {
    if (!data) return data;
    return filterApplicants(data, filters);
  }, [data, filters]);

  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      payload,
      applicationId,
    }: {
      payload: JobApplicationUpdatePayloadDto;
      applicationId: string;
    }) => {
      const result = await AdminServiceObj.updateApplicationStatus(payload, applicationId);
      if (!result) {
        throw new Error("Failed to update application status");
      }
      return result;
    },

    onMutate: async ({ payload, applicationId }) => {
      // The actual query key used by useInfiniteQuery includes the currentPageIndex
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });
      const previousData = queryClient.getQueryData(actualQueryKey);

      // Optimistically update the cache
      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((application: JobApplicationDetailsDto) => {
              if (application.id === applicationId) {
                return {
                  ...application,
                  status: payload.status,
                  updatedAt: new Date().toISOString(),
                };
              }
              return application;
            }),
          })),
        };
      });

      return { previousData, actualQueryKey };
    },

    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      console.error("Failed to update application status:", err);
      toast.error("Failed to update application status.", getToastOptions({}));
    },

    // When API returns fresh data, replace only the target record
    onSuccess: (updatedApplication: JobApplicationDetailsDto) => {
      toast.success("Application status updated successfully", getToastOptions({}));

      // Update local data array with fresh data from API
      if (!data || !Array.isArray(data)) {
        console.warn("Data is not an array or empty:", data);
        return;
      }

      const index = data.findIndex(
        (app: JobApplicationDetailsDto) => app.id === updatedApplication.id
      );

      if (index === -1) {
        console.warn("Application not found in local data:", updatedApplication.id);
        return;
      }

      // Patch the updated data into local array
      data[index] = { ...data[index], ...updatedApplication };
      // console.log(`✅ Patched application ${updatedApplication.id} in local data.`);

      // Invalidate counts to refresh stats
      queryClient.invalidateQueries({
        queryKey: ["counts", isAllApplicants ? "corporateApplicants" : "applicant"],
      });
    },
  });

  // Mutation for bulk application updates
  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload: {
      bulkJobApplicationUpdate: BulkJobApplicationUpdatePayloadItem[];
    }) => {
      return await AdminServiceObj.postBulkApplicationUpdate(payload);
    },
    onMutate: async (payload) => {
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });
      const previousData = queryClient.getQueryData(actualQueryKey);

      const statusMap = new Map(
        payload.bulkJobApplicationUpdate.map((item) => [item.jobApplicationId, item.status])
      );

      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((application: JobApplicationDetailsDto) => {
              const newStatus = statusMap.get(application.id);
              if (newStatus) {
                return {
                  ...application,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                };
              }
              return application;
            }),
          })),
        };
      });

      return { previousData, actualQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      toast.error("Failed to update applications", getToastOptions({}));
    },
    onSuccess: () => {
      toast.success("Applications updated successfully!", getToastOptions({}));
      ListSelection.reset();

      // Invalidate counts to refresh stats
      queryClient.invalidateQueries({
        queryKey: ["counts", isAllApplicants ? "corporateApplicants" : "applicant"],
      });
    },
  });

  useEffect(() => {
    ListSelection.reset();
  }, [activeTab, searchBarText, pageSize, apiStatus]);

  const onBulkUpdate = async (type: JobApplicationStatusType) => {
    try {
      if (ListSelection.selectedRows.length === 0) {
        toast.error("Please select at least one application to update.", getToastOptions({}));
        return;
      }

      const payload: BulkJobApplicationUpdatePayloadItem[] = ListSelection.selectedRows.map(
        (row) => {
          const { id, applicantUserId, ...rest } = row;
          return {
            ...rest,
            status: type,
          };
        }
      );

      await toast.promise(
        bulkUpdateMutation.mutateAsync({
          bulkJobApplicationUpdate: payload,
        }),
        {
          pending: "Updating applications...",
        },
        getToastOptions({})
      );

      // Optional background refetch after delay
      // setTimeout(() => {
      //   queryClient.invalidateQueries({ queryKey: baseQueryKey });
      // }, 2000);
    } catch (error) {
      console.error("Error in bulk update:", error);
    }
  };

  const StatusFilterDropdown = [
    { label: "All", onClick: () => setApiStatus(undefined) },
    { label: "Applied", onClick: () => setApiStatus("APPLIED") },
    { label: "Accepted", onClick: () => setApiStatus("ACCEPTED") },
    { label: "CV Downloaded", onClick: () => setApiStatus("CV_DOWNLOADED") },
    { label: "Under Evaluation", onClick: () => setApiStatus("UNDER_EVALUATION") },
    { label: "Processing Interview", onClick: () => setApiStatus("PROCESSING_INTERVIEW") },
    { label: "Interview Done", onClick: () => setApiStatus("INTERVIEW_DONE") },
    { label: "Hiring In Process", onClick: () => setApiStatus("HIRING_IN_PROCESS") },
    { label: "Hired", onClick: () => setApiStatus("HIRED") },
    { label: "Joined", onClick: () => setApiStatus("JOINED") },
    { label: "Rejected", onClick: () => setApiStatus("REJECTED") },
    { label: "On Hold", onClick: () => setApiStatus("ON_HOLD") },
  ];

  const handleBulkEvaluatorUpdate = () => {
    if (ListSelection.selectedRows.length === 0) {
      toast.error(
        "Please select at least one application to send to evaluator.",
        getToastOptions({})
      );
      return;
    }

    // Create a map of applications by ID for quick lookup
    const applicationMap = new Map(data.map((app) => [app.id, app]));

    // Get unique job IDs from selected rows
    const selectedApplications = ListSelection.selectedRows
      .map((row) => applicationMap.get(row.jobApplicationId))
      .filter((app) => app !== undefined) as JobApplicationDetailsDto[];

    // Check if all selections are from the same job (for single job scenario)
    const uniqueJobIds = new Set(selectedApplications.map((app) => app.jobId));

    if (uniqueJobIds.size === 0) {
      toast.error("No valid applications found", getToastOptions({}));
      return;
    }

    // Use the first application's job details as default (could be all same job or representative)
    const firstApp = selectedApplications[0];

    setIsAddEvaluatorModalOpen(true);
    setEvaluatorFormProps({
      Defaultvalues: {
        jobApplicationId: ListSelection.selectedRows.map((row) => row.jobApplicationId),
        jobId: firstApp.jobId,
        jobTitle: firstApp.jobTitle,
        applicantUserName: ListSelection.selectedRows.map((row) => row.applicantName),
        companyId: firstApp.companyId,
        applicantUserId: ListSelection.selectedRows.map((row) => row.applicantUserId),
        cvAwsS3ResourceType: ListSelection.selectedRows.map((row) => row.cvAwsS3ResourceType),
        candidateParsedCvId: ListSelection.selectedRows.map((row) => row.candidateParsedCvId),
        applicantUserEmail: ListSelection.selectedRows.map((row) => row.emailId),
        hrName: userDetails?.fullName ?? "",
        hrCurrentCompanyName: "WORKO",
      },
      isBulk: true,
      onClose: () => {
        setIsAddEvaluatorModalOpen(false);
        setEvaluatorFormProps(null);
      },
      formLimit: 10,
    });
  };

  const handleSendToRecruiter = async (applicationId: string, refetch: () => void) => {
    try {
      const sendPromise = AdminServiceObj.sendApplicationToRecruiters(applicationId);

      toast.promise(
        sendPromise,
        {
          pending: "Sending application to recruiter...",
          success: "Application sent to recruiter successfully!",
          error: "Failed to send application to recruiter",
        },
        getToastOptions({})
      );

      const response = await sendPromise;
      if (!response) {
        throw new Error("Failed to send application to recruiter");
      }

      refetch();
    } catch (error) {
      console.error("Error sending application to recruiter:", error);
    }
  };

  // Wrapper function to use mutation
  const handleUpdateWithMutation = (
    payload: JobApplicationUpdatePayloadDto,
    applicationId: string,
    hasRefetch: boolean
  ) => {
    updateApplicationMutation.mutate({ payload, applicationId });

    // Commented out refetch - using optimistic updates with API response patching instead
    // if (hasRefetch) {
    //   setTimeout(() => {
    //     queryClient.invalidateQueries({ queryKey: baseQueryKey });
    //   }, 2000);
    // }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[25px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails
              {...(!isAllApplicants &&
                data &&
                data.length > 0 &&
                data[0].companyId && { companyId: data[0].companyId })}
              {...(!isAllApplicants && jobId && { jobId: jobId })}
              key={jobId || "all-applicants"}
              pageType={isAllApplicants ? "corporateApplicants" : "applicant"}
            />
            <div className="bg-white max-w-[150px] mt-4 h-min min-w-20 shadow-md rounded-xl px-2 text-xs gap-2 py-3.5 text-center flex flex-col">
              <span className="text-sm font-semibold text-[#64748B]">Job Url</span>
              <InteractiveInput
                data={data && data.length > 0 ? data[0].jobUrl : ""}
                isLoading={queryIsJobsLoading}
                variant="copy"
                placeholder="No job URL available"
                width="w-auto"
              />
            </div>
            {!isAllApplicants && (
              <div className="bg-white max-w-[150px] mt-4 h-[85px] min-w-20 shadow-md rounded-xl px-2 text-xs gap-2 py-3.5 text-center flex flex-col">
                <span className="text-sm font-semibold text-[#64748B]">Job Profile</span>
                <span
                  onClick={() => {
                    window.open(data && data.length > 0 ? data[0].jobUrl : "", "_blank");
                  }}
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={
                    queryIsJobsLoading
                      ? "Loading..."
                      : data && data.length > 0
                      ? data[0].jobTitle
                      : ""
                  }
                  className="cursor-pointer capitalize text-sm font-semibold text-[#101828] truncate">
                  {queryIsJobsLoading
                    ? "Loading..."
                    : data && data.length > 0
                    ? data[0].jobTitle
                    : ""}
                </span>
              </div>
            )}
            {/*      <div className="flex flex-col gap-2 mt-4 h-min bg-white rounded-xl px-7 py-3 shadow-md">
              <span className="text-sm text-[#64748B] font-semibold  text-nowrap">Job Status</span>
              <span className="text-2xl text-blue-500 font-semibold">{getJobStatus(data)}</span>
            </div> */}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2">
            <SearchBar
              placeholder="Search by company name, email"
              searchBarText={searchBarText}
              setSearchBarText={handleSearchChange}
              handleClick={() => refetch()}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
              <ApplicantFilters onFilterChange={setFilters} className="min-w-fit" />
              <GenericDropdown
                selectTitle="Status"
                tooltipMessage="Select Status to filter applications"
                disabled={activeTab !== "All"}
                options={StatusFilterDropdown}
              />
              <BulkStatusDropDown
                options={[
                  { label: "Accept", onClick: () => onBulkUpdate("ACCEPTED") },
                  {
                    label: "Send to evaluator",
                    onClick: () => {
                      handleBulkEvaluatorUpdate();
                    },
                  },
                  {
                    label: "Initiate Interview",
                    onClick: () => onBulkUpdate("PROCESSING_INTERVIEW"),
                  },
                  { label: "Initiate Hiring", onClick: () => onBulkUpdate("HIRING_IN_PROCESS") },
                  { label: "Interview Done", onClick: () => onBulkUpdate("INTERVIEW_DONE") },
                  { label: "Joined", onClick: () => onBulkUpdate("JOINED") },
                  { label: "On Hold", onClick: () => onBulkUpdate("ON_HOLD") },
                ]}
                apiStatus={apiStatus}
                isWorkoJob={checkIsWorkoJobFromSelected(ListSelection.selectedRows, data)}
                disabled={
                  apiStatus === undefined ||
                  apiStatus === "ON_HOLD" ||
                  apiStatus === "REJECTED" ||
                  bulkUpdateMutation.isPending
                }
                tooltipMessage="Select a bulk status update"
                selectTitle="Bulk"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-[57px]">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`pb-2 border-b-2 text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-700 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
              onClick={() => handleTabChange(tab)}>
              {tab === "All" ? "All" : tab === "Hired" ? "Hired" : "Joined"}
            </button>
          ))}
        </div>
        {queryIsJobsLoading && (!data || data.length === 0) ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <ApplicationTable
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            data={filteredData}
            handleUpdate={handleUpdateWithMutation}
            userType={"ADMIN"}
            Pagination={{
              hasNextPage,
              hasPreviousPage,
              goToNextPage,
              goToPreviousPage,
              pageSize,
              setPageSize: handlePageSizeChange,
            }}
            refetch={refetch}
            EvaluatorFormProps={EvaluatorFormProps}
            setEvaluatorFormProps={setEvaluatorFormProps}
            isAddEvaluatorModalOpen={isAddEvaluatorModalOpen}
            setIsAddEvaluatorModalOpen={setIsAddEvaluatorModalOpen}
            ListSelection={ListSelection}
            sendApplicationToRecruiter={(applicationId) =>
              handleSendToRecruiter(applicationId, refetch)
            }
            showRejectReason={(applicationId) => console.log(``)}
            isBulkEvaluation={!!(ListSelection.selectedRows.length > 0)}
            onBulkUpdate={onBulkUpdate}
            isAllApplicants={isAllApplicants}
            isUpdating={updateApplicationMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default Applicants;
