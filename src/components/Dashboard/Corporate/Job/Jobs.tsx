import Modal from "../../../Shared/Modal";
import SearchBar from "../../../Shared/SearchBar";
import HeaderDetails from "../../../Shared/Stats";
import { useEffect, useState } from "react";
import SkeletonLoader from "../../../Shared/SkeletonLoader";
import { JobStatusType } from "src/types/JobsAndApplication.type";
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import JobForm from "@Components/Shared/PostJob/JobForm";
import BulkOption from "@Components/Dashboard/Corporate/Bulk";
import JobDescription from "@Components/Shared/PostJob/JobDescription";
import { JobData, JobDetails } from "@Interfaces/CorporateDashboard.dto";
import CorporateServiceObj from "../Services/Corporate.service";
import JobTableWrapper from "./JobTable";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import secureStorage from "@Utils/SecureStorage.utils";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationJobDataParams } from "src/types/interface/CorporateServices.dto";
import { useListSelection } from "@Hooks/useListSelection.hook";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUrlState } from "@Hooks/useUrlState.hook";
import CloseJob from "./CloseJob";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";

// Header Switch button constant to loop
const tabs = ["PUBLISHED", "ARCHIVED", "CLOSED"] as const;
export type SelectedRow = {
  companyId: string;
  jobId: string;
  status: "ARCHIVED" | "CLOSED" | "PUBLISHED";
};

const Jobs = () => {
  const { userDetails } = useAppContext();
  const queryClient = useQueryClient();
  const {
    activeTab,
    setActiveTab: handleTabChange,
    searchText: searchBarText,
    setSearchText: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
  } = useUrlState<JobStatusType>({
    tab: {
      defaultValue: "PUBLISHED",
      validValues: [...tabs] as JobStatusType[],
    },
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 100,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });
  const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [jobFormMode, setJobFormMode] = useState<
    "UPDATE" | "CREATE" | "DUPLICATE" | "CREATE_WITH_DATA"
  >("CREATE");
  const [isBulkCloseModalOpen, setIsBulkCloseModalOpen] = useState(false);

  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(
    SecureStorageKeyEnum.COGNITOUSERDETAILS
  );
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);

  const params: Omit<CursorPaginationJobDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "desc",
    dashboard: "CORPORATE",
    userRole: userType ? [userType] : undefined,
    status: activeTab,
    includeCompanyDetails: true,
    includeCountCompanyJobEntityJobApplication:true,
    companyId: userDetails?.companyId ?? "",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    ...(userType && !userType.includes("corporate-admin") && userCognitoDetails?.sub
      ? { corporateRecruiterUserId: userDetails?.id }
      : {}),
  };

  // Stable query key with server-side filter params
  const queryKey = [
    "CorporateJobsQuery",
    activeTab,
    !!userDetails?.companyId,
    !!searchBarText,
    pageSize,
    /*    !!userType,
    userDetails?.id, */
  ];

  const {
    data,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<JobData, CursorPaginationJobDataParams>({
    queryKey: queryKey,
    queryFn: CorporateServiceObj.fetchJobs,
    baseParams: params,
    enabled: !!userDetails?.companyId,
  });

  const {
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isSelected,
    getAllSelected,
    reset: resetSelection,
  } = useListSelection({
    limit: 10,
    mapFn: (job: JobData) => ({
      jobId: job.id,
      companyId: job?.companyDetails?.id,
      status: job.status as "PUBLISHED" | "CLOSED" | "ARCHIVED",
    }),
    keySelector: (job) => job.jobId,
  });

  // Mutation for updating single job status
  const updateJobMutation = useMutation({
    mutationFn: async ({
      payload,
      jobId,
      isDelete,
    }: {
      payload: any;
      jobId: string;
      isDelete: boolean;
    }) => {
      if (isDelete) {
        return await AdminServiceObj.deleteJob(payload, jobId);
      }
      return await AdminServiceObj.updateJob(payload, {}, jobId);
    },
    onMutate: async ({ payload, jobId, isDelete }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((job: JobData) => {
              if (job.id === jobId) {
                // If closing, update with close reason
                if (isDelete) {
                  // debugger;
                  return {
                    ...job,
                    status: "CLOSED",
                    shortSoftDeleteReason: payload.shortSoftDeleteReason,
                    detailedSoftDeleteReason: payload.detailedSoftDeleteReason,
                    ...(payload.detailedSoftDeleteReason &&
                      payload.detailedSoftDeleteReason.trim() && {
                        detailedSoftDeleteReason: payload.detailedSoftDeleteReason,
                      }),
                    updatedAt: new Date().toISOString(),
                  };
                }
                // Otherwise just update status
                return {
                  ...job,
                  status: payload.status,
                  updatedAt: new Date().toISOString(),
                };
              }
              return job;
            }),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to perform this operation.", getToastOptions({}));
    },
    onSuccess: (data, variables) => {
      const statusText = variables.isDelete ? "closed" : variables.payload.status?.toLowerCase();
      toast.success(`Job ${statusText} successfully`, getToastOptions({}));
      
      // Invalidate counts to refresh stats
      queryClient.invalidateQueries({ queryKey: ["counts", "jobs"] });
    },
  });

  // Mutation for bulk updates
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updatedData: { bulkJobUpdate: SelectedRow[] }) => {
      return await CorporateServiceObj.bulkUpdate(updatedData);
    },
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      // Create a map of jobId -> new status for quick lookup
      const statusMap = new Map(updatedData.bulkJobUpdate.map((row) => [row.jobId, row.status]));

      // Optimistically update all affected jobs
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((job: JobData) => {
              const newStatus = statusMap.get(job.id);
              if (newStatus) {
                return {
                  ...job,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                };
              }
              return job;
            }),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to perform this operation.", getToastOptions({}));
    },
    onSuccess: (data, variables) => {
      const status = variables.bulkJobUpdate[0]?.status.toLowerCase();
      toast.success(`Bulk jobs ${status} successfully.`, getToastOptions({}));
      
      // Invalidate counts to refresh stats
      queryClient.invalidateQueries({ queryKey: ["counts", "jobs"] });
    },
  });

  /**
   * Mutation for bulk close jobs.
   *
   * Uses the dedicated /job/bulk-close endpoint so that:
   * - Only successfully closed jobs move to the CLOSED tab
   * - Failed jobs stay in their current tab
   * - We can surface partial success information to the user
   */
  const bulkCloseMutation = useMutation({
    mutationFn: async (requestPayload: {
      jobs: { jobId: string; companyId?: string; jobTitle: string }[];
      shortSoftDeleteReason: string;
      detailedSoftDeleteReason?: string;
    }) => {
      return await CorporateServiceObj.bulkCloseJobs(requestPayload);
    },
    onError: () => {
      toast.error("Failed to bulk close jobs.", getToastOptions({}));
    },
    onSuccess: (data: any) => {
      try {
        const firestoreMetrics = data?.gcpFirestoreBulkJobCloseMetrics;
        const successIds: string[] = firestoreMetrics?.success?.primaryIds ?? [];
        const failureIds: string[] = firestoreMetrics?.failure?.primaryIds ?? [];

        const successCount = successIds.length;
        const failureCount = failureIds.length;

        if (failureCount > 0) {
          toast.warn(
            `${successCount} job${successCount !== 1 ? "s" : ""} closed successfully, ${failureCount} failed to close.`,
            getToastOptions({})
          );
        } else {
          toast.success(
            `${successCount} job${successCount !== 1 ? "s" : ""} closed successfully.`,
            getToastOptions({})
          );
        }
      } catch {
        // Fallback toast if response shape changes
        toast.success("Bulk close completed.", getToastOptions({}));
      }

      // Silent refresh: refetch data in the background so that
      // only truly closed jobs move to the CLOSED tab.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
  });

  /**
   * Reset pagination and selections when server-side filters change
   */
  /* useEffect(() => {
    resetSelection(); // Reset selected rows
    // Note: useCursorPagination will auto-reset when baseParams change
  }, [activeTab, searchBarText, pageSize]);
 */
  useEffect(() => {
    reset();
    resetSelection();
    // Invalidate queries to force a fresh fetch when tab changes
    queryClient.invalidateQueries({ queryKey });
  }, [activeTab]);

  // Separate effect for search and page size changes
  useEffect(() => {
    reset();
    resetSelection();
    refetch();
  }, [searchBarText, pageSize]);
  
  async function callBulkUpdate(params: "ARCHIVED" | "CLOSED" | "PUBLISHED") {
    const updatedData = { bulkJobUpdate: [...selectedRows] };
    for (let row of updatedData.bulkJobUpdate) {
      row.status = params;
    }

    await toast.promise(
      bulkUpdateMutation.mutateAsync(updatedData),
      {
        pending: `Updating jobs to ${params.toLowerCase()}...`,
      },
      getToastOptions({})
    );

    // Optional: Background refetch after delay
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 2000);
  }

  /**
   * Build and send bulk-close request using currently selected jobs.
   *
   * NOTE:
   * - Selection is already capped at 10 via useListSelection.
   * - We only pass jobs that have a valid companyId (internal jobs).
   */
  async function handleBulkCloseSubmit(closeReason: { reason: string; note: string }) {
    if (!selectedRows.length) {
      toast.error("Please select at least one job to close.", getToastOptions({}));
      return;
    }

    // Map selected row ids to full JobData for jobTitle + companyId
    const selectedIdSet = new Set(selectedRows.map((row) => row.jobId));
    const allJobs = data ?? [];
    const selectedJobsDetails = allJobs.filter((job) => selectedIdSet.has(job.id));

    const jobsPayload = selectedJobsDetails.map((job) => ({
      jobId: job.id,
      companyId: job.companyDetails?.id,
      jobTitle: job.jobTitle,
    }));

    if (!jobsPayload.length) {
      toast.error("No valid internal jobs selected to close.", getToastOptions({}));
      return;
    }

    const requestPayload = {
      jobs: jobsPayload,
      shortSoftDeleteReason: closeReason.reason,
      detailedSoftDeleteReason: closeReason.note?.trim() ? closeReason.note.trim() : undefined,
    };

    await toast.promise(
      bulkCloseMutation.mutateAsync(requestPayload),
      {
        pending: "Closing selected jobs...",
      },
      getToastOptions({})
    );

    // Clear selection after operation so failed jobs remain visible in the list.
    resetSelection();
    setIsBulkCloseModalOpen(false);
  }

  function handleJobCreation(mode: "UPDATE" | "DUPLICATE", job: any) {
    const mappedMode = mode === "UPDATE" ? "UPDATE" : "DUPLICATE";
    job as JobDetails;
    if (mode != "UPDATE") job.status = "PUBLISHED";
    setJobDetails(job);
    setJobFormMode(mappedMode);
    setIsJobFormModalOpen(true);
  }

  async function updateJobStatus(
    type: JobStatusType,
    data: {
      id: string;
      companyId: string;
    },
    closeReason?: { reason: string; note: string }
  ) {
    const payload: {
      companyId: string;
      status?: JobStatusType;
      shortSoftDeleteReason?: string;
      detailedSoftDeleteReason?: string;
    } = {
      companyId: data.companyId,
      status: type,
    };

    let isDelete = false;
    if (type === "CLOSED" && closeReason) {
      delete payload.status;
      payload.shortSoftDeleteReason = closeReason.reason;
      if (closeReason.note && closeReason.note.trim()) {
        payload.detailedSoftDeleteReason = closeReason.note;
      }
      isDelete = true;
    }

    if (type === "CLOSED" && !closeReason) {
      return;
    }

    if (!payload.status && !isDelete) {
      return;
    }

    await updateJobMutation.mutateAsync({
      payload,
      jobId: data.id,
      isDelete,
    });

    // Optional: Background refetch after delay
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-[25px] w-full mt-0 px-0">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-24 justify-between">
        <div className=" flex-1 mt-1 flex flex-col gap-0">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails
              key="admin-job-stats"
              companyId={userDetails?.companyId ?? ""}
              jobId={jobDetails?.id}
              pageType="jobs"
            />
          </div>
          <div className="flex justify-between items-end gap-4">
            <SearchBar
              placeholder="Search by job title"
              searchBarText={searchBarText}
              setSearchBarText={handleSearchChange}
              handleClick={() => refetch()}
            />
            <div className="flex w-3/12 flex-shrink-0  gap-4 justify-end lg:items-end">
              <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
                <BulkOption
                  options={[
                    activeTab != "PUBLISHED"
                      ? { label: "Open", onClick: () => callBulkUpdate("PUBLISHED") }
                      : null,
                    activeTab && RBAC.canAny(["play_admin", "play_corporate_admin"])
                      ? {
                          label: "Close",
                          onClick: () => setIsBulkCloseModalOpen(true),
                        }
                      : null,
                    activeTab != "ARCHIVED"
                      ? { label: "Archive", onClick: () => callBulkUpdate("ARCHIVED") }
                      : null,
                  ].filter(
                    (option): option is { label: string; onClick: () => Promise<void> } =>
                      option !== null
                  )}
                  disabled={
                    selectedRows.length === 0 ||
                    bulkUpdateMutation.isPending ||
                    bulkCloseMutation.isPending
                  }
                />
              </div>
              <div className="flex">
                <button
                  onClick={() => setIsJobDescriptionModalOpen(true)}
                  className="bg-gradient-to-b from-[#80E7E7] to-[#316BFF] text-white px-5 py-2 rounded-xl font-medium w-full">
                  + Post Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container to render top 3 switch buttons  */}
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
            {tab === "PUBLISHED" ? "Open" : tab === "ARCHIVED" ? "Archived" : "Closed"}
          </button>
        ))}
      </div>

      {isLoading && (!data || data.length === 0) ? (
        <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
      ) : (
        <JobTableWrapper
          activeTab={activeTab}
          data={data ?? []}
          selectedRows={selectedRows}
          selectRows={toggleRow}
          selectAllRows={toggleSelectAll}
          handleJobCreation={handleJobCreation}
          reset={resetSelection}
          updateJobStatus={updateJobStatus}
          hasNextPage={!!data && hasNextPage}
          hasPrevPage={hasPreviousPage}
          fetchNextPage={goToNextPage}
          fetchPreviousPage={goToPreviousPage}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          getAllSelected={getAllSelected}
          isUpdating={updateJobMutation.isPending}
        />
      )}
      <Modal
        isOpen={isJobFormModalOpen}
        onClose={() => setIsJobFormModalOpen(false)}
        className="w-[100dvw] lg:w-[70dvw] h-full text-left no-scrl no-scrl-web ">
        <JobForm
          onClose={() => setIsJobFormModalOpen(false)}
          jobDetails={jobDetails}
          userDetailsOne={userDetails}
          mode={jobFormMode}
          key={jobDetails?.id}
        />
      </Modal>

      <Modal isOpen={isBulkCloseModalOpen} onClose={() => setIsBulkCloseModalOpen(false)}>
        <CloseJob
          onClose={() => setIsBulkCloseModalOpen(false)}
          onSubmit={(data: { note: string; reason: string }) => {
            handleBulkCloseSubmit(data);
          }}
        />
      </Modal>

      <Modal isOpen={isJobDescriptionModalOpen} onClose={() => setIsJobDescriptionModalOpen(false)}>
        <JobDescription
          onClose={() => setIsJobDescriptionModalOpen(false)}
          setIsJobFormModalOpen={setIsJobFormModalOpen}
          setJobDetails={setJobDetails}
          setJobMode={setJobFormMode}
        />
      </Modal>
    </div>
  );
};

export default Jobs;
