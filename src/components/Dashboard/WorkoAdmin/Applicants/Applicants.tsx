import { useEffect, useState } from "react";
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
import Modal from "../../../Shared/Modal";
import GenericDropdown from "@Components/Shared/DropDown/GenericDropdown";
import { BulkJobApplicationUpdateItem, BulkJobApplicationUpdatePayloadItem } from "@Interfaces/CorporateServices.dto";
import { useListSelection } from "@Hooks/useListSelection.hook";
import AdminServiceObj from "../Services/Admin.service";
import { EvaluatorFormProps } from "@Components/Shared/ApplicantsPage/EvaluatorForm";
import BulkStatusDropDown from "@Components/Shared/ApplicantsPage/BulkStatusDropDown";
import ResponseEvaluation from "@Components/Shared/ApplicantsPage/ViewEvaluation";
import { useParams } from "react-router-dom";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { checkIsWorkoJobFromSelected, handleJobApplicationStatusUpdate } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { getToastOptions } from "@Utils/Toast.utils";

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
  const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
  const [EvaluatorFormProps, setEvaluatorFormProps] = useState<EvaluatorFormProps | null>(null);
  // Extract the job Id from the URL using useParams
  const { id: jobId } = useParams<{ id: string }>();

  //Api states
  const [activeTab, setActiveTab] = useState<"All" | "Hired" | "Joined">("All");
  const [pageSize, setPageSize] = useState(
    isAllApplicants ? 25 : 200
  );
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<JobApplicationStatusType>();

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
      applicantUserId: application.applicantDetails.userId, // ForBulk
    }),
    keySelector: (application: BulkJobApplicationUpdateItem) => application.jobApplicationId,
  });

  const params: Omit<CursorPaginationApplicationDataAdminParams, "lastKey"> = {
    //@TODO: Tally the params
    ...(apiStatus !== undefined ? { status: apiStatus } : {}),
    ...(searchBarText?.trim() ? { searchText: searchBarText } : {}),
    userType: "ADMIN",
    pageSize: pageSize,
    sortOrder: "descending",
    ...(isAllApplicants ? {} : { jobId: jobId ?? undefined }),
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
  } = useCursorPagination<JobApplicationDetailsDto, CursorPaginationApplicationDataAdminParams>({
    queryKey: [
      "AdminJobsApplicationQuery",
      activeTab,
      !!searchBarText,
      JSON.stringify(params),
      isAllApplicants,
    ],
    queryFn: AdminServiceObj.fetchApplications,
    baseParams: params,
    enabled: isAllApplicants ? true : !!jobId,
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    refetch();
    reset(); // Reset pagination when active tab changes
    ListSelection.reset(); // Reset selected rows when active tab changes
  }, [activeTab, searchBarText, pageSize, apiStatus]);

  const onBulkUpdate = async (type: JobApplicationStatusType) => {
    try {
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
      
      const updatePromise = AdminServiceObj.postBulkApplicationUpdate({
        bulkJobApplicationUpdate: payload,
      });

      toast.promise(
        updatePromise,
        {
          pending: 'Updating applications...',
          success: 'Applications updated successfully!',
          error: 'Failed to update applications'
        },
        getToastOptions({})
      );

      const data = await updatePromise; //@TODO-Use the data somewhere atleast in both corporate and admin component
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
        hrCurrentCompanyName: "WORKO",
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

  /**
   * handleSendToRecruiter - Function to handle sending application to recruiter
   *
   * @description This function sends the selected application to the recruiter for further processing.
   *
   * @param {string} applicationId - The ID of the application to be sent to the recruiter.
   * @param {Function} refetch - Function to refetch the application data after sending to recruiter.
   */
  const handleSendToRecruiter = async (applicationId: string, refetch: () => void) => {
    try {
      // Create the promise for sending application to recruiter
      const sendPromise = AdminServiceObj.sendApplicationToRecruiters(applicationId);
      
      // Use toast.promise to handle pending, success, and error states
      toast.promise(
        sendPromise,
        {
          pending: 'Sending application to recruiter...',
          success: 'Application sent to recruiter successfully!',
          error: 'Failed to send application to recruiter'
        },
        getToastOptions({})
      );

      const response = await sendPromise;
      if (!response) {
        throw new Error("Failed to send application to recruiter");
      }
      
      refetch(); // Refetch the data to reflect the changes
    } catch (error) {
      console.error("Error sending application to recruiter:", error);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails />
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
                  /*  { label: "Reject", onClick: () => onBulkUpdate("REJECTED") }, */
                ]}
                apiStatus={apiStatus} // Change this to test
                isWorkoJob={checkIsWorkoJobFromSelected(ListSelection.selectedRows, data)}
                disabled={
                  apiStatus === undefined || apiStatus === "ON_HOLD" || apiStatus === "REJECTED"
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
            userType={"ADMIN"}
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
            sendApplicationToRecruiter={(applicationId) =>
              handleSendToRecruiter(applicationId, refetch)
            }
            showRejectReason={(applicationId) => console.log(``)}
            isBulkEvaluation={!!(ListSelection.selectedRows.length > 0)}
            onBulkUpdate={onBulkUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default Applicants;
