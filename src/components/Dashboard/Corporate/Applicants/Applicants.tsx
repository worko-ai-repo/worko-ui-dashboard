import { useEffect, useState } from "react";
import ApplicationTable from "./ApplicantsTable";
import HeaderDetails from "../../../Shared/Stats";
import SearchBar from "../../../Shared/SearchBar";
import {
  CompanyDetails,
  JobApplicationDetailsDto,
  JobData,
} from "@Interfaces/CorporateDashboard.dto";
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import secureStorage from "@Utils/SecureStorage.utils";

import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import CorporateServiceObj from "../Services/Corporate.service";
import SkeletonLoader from "../../../Shared/SkeletonLoader";
import { clipboard } from "@Assets";
import { toast } from "react-toastify";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  BulkJobApplicationUpdatePayloadItem,
  CursorPaginationApplicationDataParams,
} from "src/types/interface/CorporateServices.dto";
import Modal from "../../../Shared/Modal";
import ResponseEvaluation from "../../../Shared/ApplicantsPage/ViewEvaluation";
import BulkStatusDropDown from "../../../Shared/ApplicantsPage/BulkStatusDropDown";
import GenericDropdown from "@Components/Shared/DropDown/GenericDropdown";
import { BulkJobApplicationUpdateItem } from "@Interfaces/CorporateServices.dto";
import { EvaluatorFormProps } from "../../../Shared/ApplicantsPage/EvaluatorForm";
import { useListSelection } from "@Hooks/useListSelection.hook";
import { useParams } from "react-router-dom";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { getToastOptions } from "@Utils/Toast.utils";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { TabType } from "@Utils/ApplicationButtonVisibility.utils";

export interface JobApplicationUpdatePayloadDto {
  applicantName: string;
  emailId: string;
  status: JobApplicationStatusType;
  userId: string;
  userType?: string;
  joiningDate?: string;
}

const tabs = ["All", "Hired", "Joined"] as const;

export interface ApplicationListSelectionDto {
  selectedRows: BulkJobApplicationUpdateItem[];
  toggleRow: (item: JobApplicationDetailsDto) => void;
  toggleSelectAll: (items: JobApplicationDetailsDto[]) => void;
  getAllSelected: (items: JobApplicationDetailsDto[]) => boolean;
  reset: () => void;
}

/**
 * handleJobApplicationStatusUpdate - Function to handle status updates for applications
 *
 * @param {any} payload - Additional data needed for the status update (if any)
 *
 * @return void
 */
export async function handleJobApplicationStatusUpdate(
  payload: JobApplicationUpdatePayloadDto,
  jobId: string,
  refetch?: () => void
): Promise<boolean> {
  const updatePromise = CorporateServiceObj.updateApplicationStatus(payload, jobId);

  toast.promise(
    updatePromise,
    {
      pending: "Updating application status...",
      success: `Application status updated to ${payload.status.toLowerCase()}`,
      error: "Failed to update application status",
    },
    getToastOptions({})
  );

  try {
    const response = await updatePromise;
    if (!response) {
      throw new Error("Failed to update application status");
    }
    return true;
  } catch (error) {
    console.error("Error updating status:", error);
    return false;
  } finally {
    if (refetch) refetch(); // Refetch the data to reflect the changes
  }
}

export const checkIsWorkoJobFromSelected = (
  selectedRows: BulkJobApplicationUpdateItem[],
  applications: JobApplicationDetailsDto[]
): boolean => {
  if (selectedRows.length === 0) return false;

  const selectedIds = selectedRows.map((row) => row.jobApplicationId);
  const isWorko = (app?: JobApplicationDetailsDto) =>
    Boolean(app && !app.jobCreatedByCorporateUserId && app.jobCreatedByUserId != null);

  return selectedIds.every((id) => {
    const application = applications.find((app) => app.id === id);
    return isWorko(application);
  });
};

const Applicants = () => {
  const { userDetails, fetchCorporateCompanyDetails } = useAppContext();
  const queryClient = useQueryClient();

  const {
    activeTab,
    setActiveTab: handleTabChange,
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
      defaultValue: 200,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

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

  const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
  const [EvaluatorFormProps, setEvaluatorFormProps] = useState<EvaluatorFormProps | null>(null);
  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(
    SecureStorageKeyEnum.COGNITOUSERDETAILS
  );
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);

  const [apiStatus, setApiStatus] = useState<JobApplicationStatusType | undefined>(
    getInitialApiStatus(activeTab)
  );

  const { id: jobId } = useParams<{ id: string }>();

  const ListSelection: ApplicationListSelectionDto = useListSelection({
    limit: 30,
    mapFn: (application: JobApplicationDetailsDto): BulkJobApplicationUpdateItem => ({
      id: application.id,
      emailId: application.applicantDetails.email,
      jobApplicationId: application.id,
      status: application.status,
      oldStatus: application.status,
      userType: userType ?? "corporate-recruiter",
      applicantName: application.applicantDetails.name,
      oldStatusTracker: application.statusTracker ?? [],
      applicantUserId: application.applicantDetails.userId,
    }),
    keySelector: (application: BulkJobApplicationUpdateItem) => application.jobApplicationId,
  });

  const params: Omit<CursorPaginationApplicationDataParams, "lastKey"> = {
    ...(apiStatus !== undefined ? { status: apiStatus } : {}),
    ...(searchBarText?.trim() ? { searchText: searchBarText } : {}),
    userType: userType ?? undefined,
    jobId: jobId,
    pageSize: pageSize,
    sortOrder: "descending",
  };

  const queryKey = [
    "CorporateJobsApplicationQuery",
    userDetails?.companyId || "defaultCompanyId",
    activeTab,
    searchBarText || "",
    JSON.stringify(params),
    apiStatus || "defaultStatus",
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
  } = useCursorPagination<JobApplicationDetailsDto, CursorPaginationApplicationDataParams>({
    queryKey,
    queryFn: CorporateServiceObj.fetchApplications,
    baseParams: params,
    enabled: !!jobId && !!userDetails?.companyId && !!userType,
  });

  // Mutation for single application status update
  const updateApplicationMutation = useMutation({
    mutationFn: async (payload: JobApplicationUpdatePayloadDto & { applicationId: string }) => {
      const { applicationId, ...updatePayload } = payload;
      const result = await CorporateServiceObj.updateApplicationStatus(
        updatePayload,
        applicationId
      );
      if (!result) {
        throw new Error("Failed to update application status");
      }
      return result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onError: (err) => {
      console.error(" Failed to update application status:", err);
      toast.error("Failed to update application status.", getToastOptions({}));
    },
    onSuccess: (updatedApplication: JobApplicationDetailsDto) => {
      toast.success("Application status updated successfully", getToastOptions({}));

      if (!data || !Array.isArray(data)) {
        console.warn(" Data is not an array or empty:", data);
        return;
      }

      const index = data.findIndex(
        (app: JobApplicationDetailsDto) => app.id === updatedApplication.id
      );

      if (index === -1) {
        console.warn("Application not found in local data:", updatedApplication.id);
        return;
      }

      data[index] = { ...data[index], ...updatedApplication };
      console.log(`Updated application ${updatedApplication.id} in local data.`);
    },
  });

  // Mutation for bulk application updates
  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload: {
      bulkJobApplicationUpdate: BulkJobApplicationUpdatePayloadItem[];
    }) => {
      return await CorporateServiceObj.postBulkApplicationUpdate(payload);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      const statusMap = new Map(
        payload.bulkJobApplicationUpdate.map((item) => [item.jobApplicationId, item.status])
      );

      queryClient.setQueryData(queryKey, (oldData: any) => {
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

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to update applications", getToastOptions({}));
    },
    onSuccess: () => {
      toast.success("Applications updated successfully!", getToastOptions({}));
    },
  });

  useEffect(() => {
    fetchCorporateCompanyDetails();
  }, []);

  useEffect(() => {
    refetch();
    reset();
    ListSelection.reset();
  }, [searchBarText, pageSize, apiStatus]);

  // Updated handleJobApplicationStatusUpdate with optimistic updates
  const handleJobApplicationStatusUpdate = async (
    payload: JobApplicationUpdatePayloadDto,
    applicationId: string,
    hasRefetch: boolean = false
  ) => {
    await updateApplicationMutation.mutateAsync({
      ...payload,
      applicationId,
    });

    // Optional background refetch after delay
    if (hasRefetch) {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    }
  };

  const onBulkUpdate = async (type: JobApplicationStatusType) => {
    if (ListSelection.selectedRows.length === 0) {
      toast.error("Please select at least one application to update.", getToastOptions({}));
      return;
    }

    const payload: BulkJobApplicationUpdatePayloadItem[] = ListSelection.selectedRows.map((row) => {
      const { id, applicantUserId, ...rest } = row;
      return {
        ...rest,
        status: type,
      };
    });

    await toast.promise(
      bulkUpdateMutation.mutateAsync({
        bulkJobApplicationUpdate: payload,
      }),
      {
        pending: "Updating applications...",
      },
      getToastOptions({})
    );

    ListSelection.reset();

    // Optional background refetch
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 2000);
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
    setIsAddEvaluatorModalOpen(true);
    const companyDetails: CompanyDetails | null = secureStorage.getItem<CompanyDetails>(
      SecureStorageKeyEnum.CORPORATECOMPANYDERAILS
    );
    setEvaluatorFormProps({
      Defaultvalues: {
        jobApplicationId: ListSelection.selectedRows.map((row) => row.jobApplicationId),
        jobId: data[0]?.jobId ?? "",
        jobTitle: data[0]?.jobTitle ?? "",
        applicantUserName: ListSelection.selectedRows.map((row) => row.applicantName),
        companyId: data[0]?.companyId ?? "",
        applicantUserId: ListSelection.selectedRows.map((row) => row.applicantUserId),
        applicantUserEmail: ListSelection.selectedRows.map((row) => row.emailId),
        hrName: userDetails?.fullName ?? "",
        hrCurrentCompanyName: companyDetails?.name || "",
      },
      isBulk: true,
      onClose: () => {
        setIsAddEvaluatorModalOpen(false);
        setEvaluatorFormProps(null);
      },
      formLimit: 10,
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex  flex-col mt-2">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails
              {...(data &&
                data.length > 0 &&
                data[0].companyId && { companyId: data[0].companyId })}
              {...(jobId && { jobId: jobId })}
              key={jobId || "all-applicants"}
              pageType="applicant"
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
                className="cursor-pointer text-sm capitalize font-semibold text-[#101828] truncate">
                {queryIsJobsLoading
                  ? "Loading..."
                  : data && data.length > 0
                  ? data[0].jobTitle
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <SearchBar
              placeholder="Search by company name, email"
              searchBarText={searchBarText}
              setSearchBarText={handleSearchChange}
              handleClick={() => refetch()}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
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
                disabled={
                  apiStatus === undefined || apiStatus === "REJECTED" || apiStatus === "JOINED"
                }
                isWorkoJob={checkIsWorkoJobFromSelected(ListSelection.selectedRows, data)}
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
            data={data}
            handleUpdate={handleJobApplicationStatusUpdate}
            userType={userType ?? ""}
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
            isBulkEvaluation={!!(ListSelection.selectedRows.length > 0)}
            onBulkUpdate={onBulkUpdate}
            isUpdating={updateApplicationMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default Applicants;
