import { useEffect, useState } from "react";
import BulkOption from "@Components/Dashboard/Corporate/Bulk";
import ApplicationTable from "./ApplicantsTable";
import HeaderDetails from "../Stats";
import SearchBar from "../SearchBar";
import { useQuery } from "@tanstack/react-query";
import { ApiResponseDto, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { useAppContext } from "@Context/App.context";
import secureStorage from "@Utils/SecureStorage.utils";
import { CognitoMetaDataDto, getToastOptions } from "lib-worko-ui";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import CorporateServiceObj from "../Services/Corporate.service";
import SkeletonLoader from "../SkeletonLoader";
import { clipboard } from "@Assets";
import { toast } from "react-toastify";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationApplicationDataParams } from "src/types/corporateServices.types";

const stats = [
  { label: "Total Applicants", value: 106 },
  { label: "Rejected", value: 90 },
  { label: "Reviewed", value: 20 },
  { label: "New Applicants", value: 10 },
  { label: "Hired", value: 90 },
];
export interface JobApplicationUpdatePayloadDto {
  applicantName: string;
  emailId: string;
  status: applcationType;
  userId: string;
  userType?: string;
}

const tabs = ["All", "Hired", "Joined"] as const;
export type applcationType = "ALL" | "APPLIED" | "CV_DOWNLOADED" | "UNDER_EVALUATION" | "PROCESSING_INTERVIEW" | "INTERVIEW_DONE" | "HIRED" | "REJECTED" | "ON_HOLD" | "JOINED";

/**
 * handleJobApplicationStatusUpdate - Function to handle status updates for applications
 *
 * @param {any} payload - Additional data needed for the status update (if any)
 *
 * @return void
 */
export async function handleJobApplicationStatusUpdate(payload: JobApplicationUpdatePayloadDto, jobId: string, refetch: () => void): Promise<void> {
  try {
    // Here you would typically make an API call to update the status
    const response = await CorporateServiceObj.updateApplicationStatus(payload, jobId);
    if (!response) {
      throw new Error("Failed to update application status");
    }
    toast.success(`Application status updated to ${payload.status.toLocaleLowerCase()}`, getToastOptions({}));
    console.log(`Status updated to ${payload.status}`);
    // Optionally, you can refresh the data or perform other actions after updating
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error(`Failed to update application status: ${error}`, getToastOptions({}));
  } finally {
    refetch(); // Refetch the data to reflect the changes
  }
}

const Applicants = () => {
  const { userDetails } = useAppContext();

  // State management
  const [activeTab, setActiveTab] = useState<"All" | "Hired" | "Joined">("All");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const userCognitoDetails = secureStorage.getItem<CognitoMetaDataDto>(SecureStorageKeyEnum.COGNITOUSERDETAILS);
  const userType = userCognitoDetails?.["cognito:groups"]?.[0];

  //Api states
  const [pageSize, setPageSize] = useState(10);
  const [searchBarText, setSearchBarText] = useState<string | null>(null);

  const params: Omit<CursorPaginationApplicationDataParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    //@Todo add status
    companyId: userDetails.companyId ?? "", // Now guaranteed to be string
    userType, // Add corporateRecruiterUserId if user is not corporate-admin
    // Add search text if it exists and is not empty
    ...(activeTab !== "All" ? { status: activeTab === "Hired" ? "HIRED" : "JOINED" } : {}),
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    /*  ...(userType && 
          !userType.includes("corporate-admin") && 
          userCognitoDetails?.sub ?  @Todo : Verify this if this is needed
          { corporateRecruiterUserId: userCognitoDetails.sub } : {}), */
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
    queryKey: ["CorporateJobsApplicationQuery", !!userDetails.companyId, activeTab, !!searchBarText,params],
    queryFn: CorporateServiceObj.fetchApplications,
    baseParams: params,
    enabled: !!userDetails.companyId, // only run if companyId exists
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [activeTab, searchBarText, pageSize]);

  /**
   * getJobStatus
   */
  const getJobStatus = () => {
    if (data && data.length > 0) {
      switch (data[0].status) {
        case "PUBLISHED":
          return "Hiring";
        case "CLOSED":
          return "Closed";
        case "ARCHIVED":
          return "On Hold";
        default:
          return "N/A";
      }
      return "N/A"; // Default case if no status matches
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col gap-[35px]">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails />
            <div className="bg-white max-w-[150px] shadow-md rounded-xl px-2 text-xs gap-2 py-4 text-center flex flex-col">
              <span className="text-sm font-semibold text-[#64748B]">Job Url</span>
              <div className="flex border rounded-lg items-center">
                <div className="px-2 py-1 rounded-lg truncate text-[#C0B7B7]">{data ? (data[0] as JobApplicationDetailsDto)?.jobUrl : "Fetching"}</div>
                <button
                  onClick={() => {
                    const jobUrl = data ? (data[0] as JobApplicationDetailsDto)?.jobUrl : "";
                    if (jobUrl) {
                      navigator.clipboard.writeText(jobUrl).then(() => {
                        toast.success("Copied to clipboard!", getToastOptions({}));
                      });
                    }
                  }}
                  className="bg-blue-500  p-1 w-auto h-full rounded-lg active:scale-95 ">
                  <img src={clipboard} alt="Clipboard icon" className=" w-12 h-auto  " />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 bg-white rounded-xl px-7 py-4 shadow-md">
              <span className="text-sm text-[#64748B] font-semibold  text-nowrap">Job Status</span>
              <span className="text-2xl text-blue-500 font-semibold">{getJobStatus()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar searchBarText={searchBarText} setSearchBarText={setSearchBarText} handleClick={() => console.log("Search clicked")} />

            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
              <BulkOption
                options={[
                  { label: "Send to evaluator", onClick: () => console.log("Send to evaluator clicked") },
                  { label: "Reject", onClick: () => console.log("Reject clicked") },
                  { label: "Initiate Interview", onClick: () => console.log("Initiate interview clicked") },
                  { label: "Accept", onClick: () => console.log("Accept clicked") },
                  { label: "On Hold", onClick: () => console.log("On hold clicked") },
                  { label: "Hired", onClick: () => console.log("Hired clicked") },
                  { label: "Joined", onClick: () => console.log("Joined clicked") },
                ]}
                disabled={false}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-[57px]">
          {tabs.map((tab) => (
            <button key={tab} className={`pb-2 border-b-2 text-sm ${activeTab === tab ? "border-blue-500 text-blue-700 font-semibold" : "border-transparent text-gray-500"}`} onClick={() => setActiveTab(tab)}>
              {tab === "All" ? "All" : tab === "Hired" ? "Hired" : "Joined"}
            </button>
          ))}
        </div>
        {queryIsJobsLoading ? <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} /> : <ApplicationTable activeTab={activeTab} setActiveTab={setActiveTab} selectedRows={selectedRows} setSelectedRows={setSelectedRows} data={data} handleUpdate={(payload, jobId) => handleJobApplicationStatusUpdate(payload, jobId, refetch)} userType={userType ?? ""} Pagination={{ hasNextPage, hasPreviousPage, goToNextPage, goToPreviousPage, pageSize, setPageSize }} />}
      </div>
    </div>
  );
};

export default Applicants;
