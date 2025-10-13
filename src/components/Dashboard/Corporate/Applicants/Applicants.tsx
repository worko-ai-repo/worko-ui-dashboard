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

export interface JobApplicationUpdatePayloadDto {
  applicantName: string;
  emailId: string;
  status: JobApplicationStatusType;
  userId: string;
  userType?: string;
  joiningDate?: string;
}

const tabs = ["All", "Hired", "Joined"] as const;

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

export interface ApplicationListSelectionDto {
  selectedRows: BulkJobApplicationUpdateItem[];
  toggleRow: (item: JobApplicationDetailsDto) => void;
  toggleSelectAll: (items: JobApplicationDetailsDto[]) => void;
  getAllSelected: (items: JobApplicationDetailsDto[]) => boolean;
  reset: () => void;
}
export const checkIsWorkoJobFromSelected = (
  selectedRows: BulkJobApplicationUpdateItem[],
  applications: JobApplicationDetailsDto[]
): boolean => {
  if (selectedRows.length === 0) return false;

  const selectedIds = selectedRows.map((row) => row.jobApplicationId);
  // Consider selection as Worko only if ALL selected are Worko jobs.
  // If any external job is selected, treat as external (i.e., not Worko).
  const isWorko = (app?: JobApplicationDetailsDto) =>
    Boolean(app && !app.jobCreatedByCorporateUserId && app.jobCreatedByUserId != null);

  return selectedIds.every((id) => {
    const application = applications.find((app) => app.id === id);
    return isWorko(application);
  });
};

const Applicants = () => {
  const { userDetails, fetchCorporateCompanyDetails } = useAppContext();

  const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
  const [EvaluatorFormProps, setEvaluatorFormProps] = useState<EvaluatorFormProps | null>(null);
  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(
    SecureStorageKeyEnum.COGNITOUSERDETAILS
  );
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);
  //Api states
  const [activeTab, setActiveTab] = useState<"All" | "Hired" | "Joined">("All");
  const [pageSize, setPageSize] = useState(25);
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<JobApplicationStatusType>();
  // Extract the job Id from the URL using useParams
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
      applicantUserId: application.applicantDetails.userId, // ForBulk
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
    queryKey: [
      "CorporateJobsApplicationQuery",
      userDetails?.companyId || "defaultCompanyId",
      activeTab,
      searchBarText || "",
      JSON.stringify(params), // Serialize params for stability
      apiStatus || "defaultStatus",
    ],
    queryFn: CorporateServiceObj.fetchApplications,
    baseParams: params,
    enabled: !!jobId && !!userDetails?.companyId && !!userType, // Ensure all dependencies are ready
  });

  /**
   * UseEffect to fetch corporate company details on component mount
   */
  useEffect(() => {
    fetchCorporateCompanyDetails();
  }, []);

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    refetch();
    reset(); // Reset pagination when active tab changes
    ListSelection.reset();
  }, [activeTab, searchBarText, pageSize, apiStatus]);

  const onBulkUpdate = async (type: JobApplicationStatusType) => {
    if (ListSelection.selectedRows.length === 0) {
      toast.error("Please select at least one application to update.", getToastOptions({}));
      return;
    }

    const payload: BulkJobApplicationUpdatePayloadItem[] = ListSelection.selectedRows.map((row) => {
      const { id, applicantUserId, ...rest } = row;
      return {
        ...rest,
        status: type, // Set the new status based on the dropdown selection
      };
    });

    const updatePromise = CorporateServiceObj.postBulkApplicationUpdate({
      bulkJobApplicationUpdate: payload,
    });

    toast.promise(
      updatePromise,
      {
        pending: "Updating applications...",
        success: "Applications updated successfully!",
        error: "Failed to update applications",
      },
      getToastOptions({})
    );

    try {
      await updatePromise;
    } catch (error) {
      console.error("Error in bulk update:", error);
    } finally {
      refetch(); // Refetch the data to reflect the changes
      ListSelection.reset(); // Reset the selection after bulk update
    }
  };

  useEffect(() => {
    switch (activeTab) {
      case "All":
        setApiStatus(undefined);
        break;
      case "Hired":
        setApiStatus("HIRING_IN_PROCESS");
        break;
      case "Joined":
        setApiStatus("JOINED");
        break;
      default:
        setApiStatus(undefined);
    }
  }, [activeTab]);

  const StatusFilterDropdown = [
    { label: "All", onClick: () => setApiStatus(undefined) },
    { label: "Applied", onClick: () => setApiStatus("APPLIED") },
    { label: "Accepted", onClick: () => setApiStatus("ACCEPTED") },
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
    //@TODO:Update the status
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex  flex-col mt-2">
        <div className="flex flex-wrap  gap-4">
            <HeaderDetails
              {...data && data.length > 0 && data[0].companyId && { companyId: data[0].companyId }}
              { ...jobId && { jobId: jobId }}
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
            {/*      <div className="flex flex-col gap-2 mt-4 h-min bg-white rounded-xl px-7 py-3 shadow-md">
              <span className="text-sm text-[#64748B] font-semibold  text-nowrap">Job Status</span>
              <span className="text-2xl text-blue-500 font-semibold">{getJobStatus(data)}</span>
            </div> */}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              placeholder="Search by name, email"
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
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
                  /*   { label: "Reject", onClick: () => onBulkUpdate("REJECTED") }, */
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
              onClick={() => setActiveTab(tab)}>
              {tab === "All" ? "All" : tab === "Hired" ? "Hired" : "Joined"}
            </button>
          ))}
        </div>
        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <ApplicationTable
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={data}
            handleUpdate={(payload, jobId, hasRefetch) =>
              handleJobApplicationStatusUpdate(payload, jobId, hasRefetch ? refetch : undefined)
            }
            userType={userType ?? ""}
            Pagination={{
              hasNextPage,
              hasPreviousPage,
              goToNextPage,
              goToPreviousPage,
              pageSize,
              setPageSize,
            }}
            refetch={refetch}
            EvaluatorFormProps={EvaluatorFormProps}
            setEvaluatorFormProps={setEvaluatorFormProps}
            isAddEvaluatorModalOpen={isAddEvaluatorModalOpen}
            setIsAddEvaluatorModalOpen={setIsAddEvaluatorModalOpen}
            ListSelection={ListSelection}
            isBulkEvaluation={!!(ListSelection.selectedRows.length > 0)}
            onBulkUpdate={onBulkUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default Applicants;
