import { useEffect, useState } from "react";
import { JobStatusType } from "src/types/jobs.type";
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import JobForm from "@Components/Shared/PostJob/JobForm";
import BulkOption from "@Components/Dashboard/Corporate/Bulk";
import JobDescription from "@Components/Shared/PostJob/JobDescription";
import { JobData, JobDetails } from "@Interfaces/CorporateDashboard.dto";
import JobTableWrapper from "./JobTable";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import secureStorage from "@Utils/SecureStorage.utils";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationJobDataParams } from "src/types/interface/CorporateServices.dto";
import { useListSelection } from "@Hooks/useListSelection.hook";
import AdminServiceObj from "../Services/Admin.service";
import SearchBar from "@Components/Shared/SearchBar";
import HeaderDetails from "@Components/Shared/Stats";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import Modal from "@Components/Shared/Modal";
import { CursorPaginationAdminJobDataParams } from "@Interfaces/AdminServices.dto";

// Header Switch button constant to loop
const tabs = ["PUBLISHED", "ARCHIVED", "CLOSED"] as const;
export type SelectedRow = {
  companyId: string;
  jobId: string;
  status: "ARCHIVED" | "CLOSED" | "PUBLISHED";
};

const AdminJobs = () => {
  const { userDetails } = useAppContext();

  const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [jobFormMode, setJobFormMode] = useState<"UPDATE" | "CREATE" | "DUPLICATE">("CREATE");
  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(SecureStorageKeyEnum.COGNITOUSERDETAILS);
  const userType = userCognitoDetails?.["cognito:groups"];

  const {
    selectedRows,
    toggleRow,
    toggleSelectAll,
    getAllSelected,
    reset: resetSelection,
  } = useListSelection({
    limit: 5, //@TODO change this to 30
    mapFn: (job: JobData) => ({
      jobId: job.id,
      companyId: job.companyDetails.id,
      status: job.status as "PUBLISHED" | "CLOSED" | "ARCHIVED",
    }),
    keySelector: (job) => job.jobId,
  });

  // Api States
  const [activeTab, setActiveTab] = useState<JobStatusType>("PUBLISHED");
  const [pageSize, setPageSize] = useState(10);
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const params: Omit<CursorPaginationAdminJobDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "desc",
    dashboard: "ADMIN",
    status: activeTab,
    // Add search text if it exists and is not empty
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

  const { data, isLoading, hasNextPage, hasPreviousPage, goToNextPage, goToPreviousPage, refetch, reset } = useCursorPagination<JobData, CursorPaginationAdminJobDataParams>({
    queryKey: ["AdminJobsQuery", activeTab, !!searchBarText, params],
    queryFn: AdminServiceObj.fetchJobs,
    baseParams: params,
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
    const response = await AdminServiceObj.bulkUpdate(updatedData);
    if (response) toast.success(`Bulk jobs ${params.toLocaleLowerCase()} successfully. `, getToastOptions({}));
    else toast.error("Failed to perform this operation.", getToastOptions({}));
    refetch();
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
    type: "ARCHIVED" | "CLOSED" | "PUBLISHED",
    data: {
      id: string;
      companyId: string;
    }
  ) {
    // construct the payload
    const payload = {
      companyId: data.companyId,
      status: type,
    };
    const response = await AdminServiceObj.updateJob(payload, {}, data.id);
    if (response) {
      toast.success(`Job ${type.toLocaleLowerCase()} successfully`, getToastOptions({}));
    } else {
      toast.error("Failed to perform this operation.", getToastOptions({}));
    }
    refetch();
  }

  return (
    <div className="flex flex-col gap-[35px] w-full px-0">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-24 justify-between">
        <div className=" flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 justify-start">
            <HeaderDetails />
          </div>

          <div className="flex justify-between items-end gap-4">
            <SearchBar searchBarText={searchBarText} setSearchBarText={setSearchBarText} handleClick={() => refetch()} />
            <div className="flex w-3/12 flex-shrink-0  gap-4 justify-center lg:items-end">
              <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
                {/* <FilterToggle /> */}
                <BulkOption options={[activeTab != "PUBLISHED" ? { label: "Open", onClick: () => callBulkUpdate("PUBLISHED") } : null, activeTab != "CLOSED" ? { label: "Close", onClick: () => callBulkUpdate("CLOSED") } : null, activeTab != "ARCHIVED" ? { label: "Archive", onClick: () => callBulkUpdate("ARCHIVED") } : null].filter((option): option is { label: string; onClick: () => Promise<void> } => option !== null)} disabled={selectedRows.length === 0} />
              </div>
              <div className="flex">
                <button onClick={() => setIsJobDescriptionModalOpen(true)} className="bg-gradient-to-b from-[#80E7E7] to-[#316BFF] text-white px-5 py-2 rounded-xl font-medium w-full">
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
          <button key={tab} className={`pb-2 border-b-2 text-sm ${activeTab === tab ? "border-blue-500 text-blue-700 font-semibold" : "border-transparent text-gray-500"}`} onClick={() => setActiveTab(tab)}>
            {tab === "PUBLISHED" ? "Open" : tab === "ARCHIVED" ? "Archived" : "Closed"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
      ) : (
        <JobTableWrapper activeTab={activeTab} data={data ?? []} selectedRows={selectedRows} selectRows={toggleRow} selectAllRows={toggleSelectAll} handleJobCreation={handleJobCreation} reset={resetSelection} updateJobStatus={updateJobStatus} hasNextPage={!!data && hasNextPage} hasPrevPage={hasPreviousPage} fetchNextPage={goToNextPage} fetchPreviousPage={goToPreviousPage} pageSize={pageSize} setPageSize={setPageSize} getAllSelected={getAllSelected} />
      )}
      <Modal isOpen={isJobFormModalOpen} onClose={() => setIsJobFormModalOpen(false)} title="Check the details" className="w-[100dvw] lg:w-[70dvw] h-full text-left no-scrl no-scrl-web ">
        <JobForm onClose={() => setIsJobFormModalOpen(false)} jobDetails={jobDetails} userDetailsOne={userDetails} mode={jobFormMode} />
      </Modal>

      <Modal isOpen={isJobDescriptionModalOpen} onClose={() => setIsJobDescriptionModalOpen(false)}>
        <JobDescription onClose={() => setIsJobDescriptionModalOpen(false)} setIsJobFormModalOpen={setIsJobFormModalOpen} setJobDetails={setJobDetails} />
      </Modal>
    </div>
  );
};

export default AdminJobs;
