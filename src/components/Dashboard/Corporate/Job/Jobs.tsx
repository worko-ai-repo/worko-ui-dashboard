import Modal from "../Modal";
import SearchBar from "../SearchBar";
import HeaderDetails from "../Stats";
import { useEffect, useState } from "react";
import SkeletonLoader from "../SkeletonLoader";
import { JobStatusType } from "src/types/jobs.type";
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import JobForm from "@Components/Shared/PostJob/JobForm";
import BulkOption from "@Components/Dashboard/Corporate/Bulk";
import JobDescription from "@Components/Shared/PostJob/JobDescription";
import { JobApiResponse, JobData, JobDetails } from "@Interfaces/CorporateDashboard.dto";
import CorporateServiceObj from "../Services/Corporate.service";
import JobTableWrapper from "./JobTable";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import secureStorage from "@Utils/SecureStorage.utils";

// Header Switch button constant to loop
const tabs = ["PUBLISHED", "ARCHIVED", "CLOSED"] as const;
export type SelectedRow = {
  companyId: string;
  jobId: string;
  status: "ARCHIVED" | "CLOSED" | "PUBLISHED";
};

const Jobs = () => {
  const { userDetails } = useAppContext();

  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);
  const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [activeTab, setActiveTab] = useState<JobStatusType>("PUBLISHED");
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [jobFormMode, setJobFormMode] = useState<"UPDATE" | "CREATE" | "DUPLICATE">("CREATE");
  const userCognitoDetails =secureStorage.getItem<CognitoMetaDataDto>(SecureStorageKeyEnum.COGNITOUSERDETAILS );
  const userType =userCognitoDetails?.["cognito:groups"];
 
    
  const params: {
      pageSize: string;
      sortOrder: string;
      dashboard: string;
      userRole: string[] | undefined;
      status: JobStatusType;
      searchText?: string;
      companyId?: string;
      corporateRecruiterUserId?: string;
    } = {
      pageSize: "25",
      sortOrder: "desc",
      dashboard: "CORPORATE",
      userRole: userType,
      status: activeTab,
      ...(searchBarText?.trim() ? { searchText: searchBarText } : {}),
    };

  const {
    data,
    isLoading: queryIsJobsLoading,
    error,
    refetch,
  } = useQuery<JobApiResponse | null>({
    queryKey: ["CorporateJobsQuery", userDetails.companyId, activeTab, searchBarText],
    queryFn: () => {
      if (!userDetails.companyId) {
        return Promise.reject("No companyId");
      }
      let updatedParams = { ...params, companyId: userDetails.companyId };
      if (userType && !userType.includes("corporate-admin")) {
        updatedParams = { ...updatedParams, corporateRecruiterUserId: userCognitoDetails?.sub };
      }
      return CorporateServiceObj.fetchJobs(updatedParams);
    },
    enabled: !!userDetails.companyId, // only run if companyId exists
  });

  useEffect(() => {
    // clear the selected rows
    setSelectedRows([]);
  }, [activeTab]);

  async function callBulkUpdate(params: "ARCHIVED" | "CLOSED" | "PUBLISHED") {
    // update status of selectedRows element status with the params
    const updatedData = { bulkJobUpdate: [...selectedRows] };
    for (let row of updatedData.bulkJobUpdate) {
      row.status = params;
    }
    const response = await CorporateServiceObj.bulkUpdate(updatedData);
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
    const response = await CorporateServiceObj.updateJob(payload, {}, data.id);
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

      {queryIsJobsLoading ? <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} /> : <JobTableWrapper activeTab={activeTab} data={data as JobApiResponse} selectedRows={selectedRows} setSelectedRows={setSelectedRows} handleJobCreation={handleJobCreation} updateJobStatus={updateJobStatus} />}
      <Modal isOpen={isJobFormModalOpen} onClose={() => setIsJobFormModalOpen(false)} title="Check the details" className="w-[100dvw] lg:w-[70dvw] h-full text-left no-scrl no-scrl-web ">
        <JobForm onClose={() => setIsJobFormModalOpen(false)} jobDetails={jobDetails} userDetailsOne={userDetails} mode={jobFormMode} />
      </Modal>

      <Modal isOpen={isJobDescriptionModalOpen} onClose={() => setIsJobDescriptionModalOpen(false)}>
        <JobDescription onClose={() => setIsJobDescriptionModalOpen(false)} setIsJobFormModalOpen={setIsJobFormModalOpen} setJobDetails={setJobDetails} />
      </Modal>
    </div>
  );
};

export default Jobs;
