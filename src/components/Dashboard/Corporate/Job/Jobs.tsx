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

// Header Switch button constant to loop
const tabs = ["PUBLISHED", "ARCHIVED", "CLOSED"] as const;
export type SelectedRow = {
  companyId: string;
  jobId: string;
  status: "ARCHIVED" | "CLOSED" | "PUBLISHED";
};

const Jobs = () => {
  const { userDetails } = useAppContext();

  const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [jobFormMode, setJobFormMode] = useState<
    "UPDATE" | "CREATE" | "DUPLICATE" | "CREATE_WITH_DATA"
  >("CREATE");
  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(
    SecureStorageKeyEnum.COGNITOUSERDETAILS
  );
  const userType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);

  const {
    selectedRows,
    toggleRow,
    toggleSelectAll,
    isSelected,
    getAllSelected,
    reset: resetSelection,
  } = useListSelection({
    limit: 30,
    mapFn: (job: JobData) => ({
      jobId: job.id,
      companyId: job?.companyDetails?.id,
      status: job.status as "PUBLISHED" | "CLOSED" | "ARCHIVED",
    }),
    keySelector: (job) => job.jobId,
  });

  // Api States
  const [activeTab, setActiveTab] = useState<JobStatusType>("PUBLISHED");
  const [pageSize, setPageSize] = useState(10);
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const params: Omit<CursorPaginationJobDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "desc",
    dashboard: "CORPORATE",
    userRole: userType ? [userType] : undefined,
    status: activeTab,
    includeCompanyDetails: true,
    companyId: userDetails?.companyId ?? "", // Now guaranteed to be string
    // Add search text if it exists and is not empty
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    // Add corporateRecruiterUserId if user is not corporate-admin
    ...(userType && !userType.includes("corporate-admin") && userCognitoDetails?.sub
      ? { corporateRecruiterUserId: userDetails?.id }
      : {}),
  };

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
    queryKey: [
      "CorporateJobsQuery",
      !!userDetails?.companyId,
      activeTab,
      !!searchBarText,
      JSON.stringify(params),
    ],
    queryFn: CorporateServiceObj.fetchJobs,
    baseParams: params,
    enabled: !!userDetails?.companyId, // Only enable if companyId exists
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   * This ensures that when switching tabs, the selected rows are cleared
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
    resetSelection(); // Reset selected rows when active tab changes
    refetch(); // Refetch data when active tab changes @TODO:Make sure to refetch only when necessary
  }, [activeTab, searchBarText, pageSize]);

  async function callBulkUpdate(params: "ARCHIVED" | "CLOSED" | "PUBLISHED") {
    // update status of selectedRows element status with the params
    const updatedData = { bulkJobUpdate: [...selectedRows] };
    for (let row of updatedData.bulkJobUpdate) {
      row.status = params;
    }
    
    const bulkUpdatePromise = CorporateServiceObj.bulkUpdate(updatedData);
    
    toast.promise(
      bulkUpdatePromise,
      {
        pending: `Updating jobs to ${params.toLowerCase()}...`,
        success: `Bulk jobs ${params.toLowerCase()} successfully.`,
        error: "Failed to perform this operation."
      },
      getToastOptions({})
    );
    
    const response = await bulkUpdatePromise;
    if (response) {
      refetch();
    }
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
    // construct the payload
    const payload: {
      companyId: string;
      status?: JobStatusType;
      shortSoftDeleteReason?: string;
      detailedSoftDeleteReason?: string;
    } = {
      companyId: data.companyId,
      status: type,
    };
    if (type === "CLOSED" && closeReason) {
      delete payload.status;
      payload.shortSoftDeleteReason = closeReason.reason;
      payload.detailedSoftDeleteReason = closeReason.note;
    }
    
    let updatePromise: Promise<any>;
    
    if (type === "CLOSED") {
      updatePromise = AdminServiceObj.deleteJob(payload, data.id);
    } else {
      if (payload.status) {
        updatePromise = AdminServiceObj.updateJob(
          { ...payload, status: payload.status },
          {},
          data.id
        );
      } else {
        return;
      }
    }
    
    toast.promise(
      updatePromise,
      {
        pending: `Updating job status to ${type.toLowerCase()}...`,
        success: `Job ${type.toLowerCase()} successfully`,
        error: "Failed to perform this operation."
      },
      getToastOptions({})
    );
    
    const response = await updatePromise;
    if (response) {
      refetch();
    }
  }

  return (
    <div className="flex flex-col gap-[35px] w-full mt-2 px-0">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-24 justify-between">
        <div className=" flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4">
            <SearchBar
              placeholder="Search by job title"
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => refetch()}
            />
            <div className="flex w-3/12 flex-shrink-0  gap-4 justify-center lg:items-end">
              <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
                {/* <FilterToggle /> */}
                <BulkOption
                  options={[
                    activeTab != "PUBLISHED"
                      ? { label: "Open", onClick: () => callBulkUpdate("PUBLISHED") }
                      : null,
/*                     activeTab != "CLOSED"
                      ? { label: "Close", onClick: () => callBulkUpdate("CLOSED") }
                      : null, */
                    activeTab != "ARCHIVED"
                      ? { label: "Archive", onClick: () => callBulkUpdate("ARCHIVED") }
                      : null,
                  ].filter(
                    (option): option is { label: string; onClick: () => Promise<void> } =>
                      option !== null
                  )}
                  disabled={selectedRows.length === 0}
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

      {/* Container to render top 3 switch buttions  */}
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
            {tab === "PUBLISHED" ? "Open" : tab === "ARCHIVED" ? "Archived" : "Closed"}
          </button>
        ))}
      </div>

      {isLoading ? (
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
          setPageSize={setPageSize}
          getAllSelected={getAllSelected}
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
