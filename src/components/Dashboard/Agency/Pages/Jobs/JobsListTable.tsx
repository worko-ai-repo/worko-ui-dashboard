import React, { useState } from "react";
import { Eye, Pencil, Upload, User } from "lucide-react";
import { DynamicTable } from "../../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { Edit, View } from "@AssetsFolder/assets";
import ProgressCircle from "@Components/Shared/CircularBarAgency";
import { newDisplayStatus, statusColors } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { JobApplicationStatusType } from "@TypesAndConstants/JobsAndApplication.type";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { AgencyJobsList } from "@Interfaces/AgencyDashboardList.dto";
import UploadProfile from "./modals/UploadProfile";


export const getCvViewDate = (statusTracker: any[]) => {
  const cvDownloadedEntry = statusTracker?.find((entry) => entry.newStatus === "CV_DOWNLOADED");
  return cvDownloadedEntry
    ? new Date(cvDownloadedEntry.actionDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "-";
};

export const getCvDownloadedById = (row: any) => {
  const cvDownloadedEntry = row.statusTracker?.find((entry:any) => entry.newStatus === "CV_DOWNLOADED");
  const isUserIdTypeULID = cvDownloadedEntry?.userId?.length === 26 || cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID ? { updatedByUserId: cvDownloadedEntry?.userId || "" } : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
};

export const getCurrentPositionCell = (row: any) => {
  let currentExperience = row.multipleCandidateExperience?.find((exp: any) => !exp.endDate);
  if (!currentExperience) {
    currentExperience = row.multipleCandidateExperience
      ?.filter((exp: any) => exp.endDate)
      .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())?.[0];
  }
  return currentExperience || null;
};


export default function JobsListTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
  } = props as any;

  // State required for table interactions
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");
  const [scorePointsModal, setScorePointsModal] = useState<any>();
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({ isOpen: false, applicant: {} as any, action: "EDIT" as "EDIT" | "VIEW" });
  const [editProfileView,setEditProfileView] = useState<boolean>(false);
  const [editProfileData,setEditProfileData] = useState<AgencyJobsList | undefined>();
  const [feedbackModalOpen,setFeedbackModalOpen] = useState<boolean>(false);
  const [isProfileUploadModalOpen,setIsProfileUploadModalOpen] = useState<boolean>(false);
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };

  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    matchingScore: ["matchingScore", "scoreDetails.matchingScore", "scoreDetails.matchingScorePercentage"],
    experience: ["applicantDetails.YOE", "yoe"],
    location: ["applicantDetails.location"],
    applicantDetails_candidateExperience_designation: ["applicantDetails.candidateExperience.designation"],
    applicantDetails_CTC: ["applicantDetails.CTC"],
    current_CTC: ["applicantDetails.CTC"], //changed currentCTC to current_CTC
    ECTC: ["applicantDetails.ECTC"],
    remarks: ["remarks", "remark"],
  };
//   const { sortedData, onSortChange } = useSortableData(data as any, keyFallbacks);

    const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: `agency`,
    persistInUrl: true,
    persistInLocalStorage: false,
    defaultSort: null,
    });

  // Helpers for status transitions
  const shouldShowUpdateIcon = (row: any) => {
    return row.status !== "REJECTED" && row.status !== "HIRED";
  };

  const toggleDropdown = (rowIndex: string) => {
    setDropdownVisibleRows((prev) => (prev.includes(rowIndex) ? prev.filter((id) => id !== rowIndex) : [...prev, rowIndex]));
  };

  const isDropdownVisible = (rowIndex: string) => dropdownVisibleRows.includes(rowIndex);

  const statusArray = ["APPLIED", "CV_DOWNLOADED", "UNDER_EVALUATION", "PROCESSING_INTERVIEW", "INTERVIEW_DONE", "HIRED", "REJECTED"];

  const isOptionDisabled = (option: string, currentStatus: string) => {
    const statusOrder: Record<string, number> = {
      APPLIED: 0,
      CV_DOWNLOADED: 1,
      UNDER_EVALUATION: 2,
      PROCESSING_INTERVIEW: 3,
      INTERVIEW_DONE: 4,
      HIRED: 5,
      REJECTED: 6,
    };
    return option !== "REJECTED" && statusOrder[option] <= statusOrder[currentStatus];
  };

  const transformStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      APPLIED: "Applied",
      CV_DOWNLOADED: "CV Downloaded",
      UNDER_EVALUATION: "Under Evaluation",
      PROCESSING_INTERVIEW: "Processing Interview",
      INTERVIEW_DONE: "Interview Done",
      HIRED: "Hired",
      REJECTED: "Rejected",
      ON_HOLD: "On Hold",
    };
    return statusMap[status] || status;
  };

  const handleStatusUpdate = (status: string, row: any, hasRefetch: boolean = true) => {
    const payload = {
      applicantName: row.applicantDetails?.name,
      emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
      status,
      userId: userDetails ? userDetails?.id : "",
      userType,
    };
    handleUpdate && handleUpdate(payload, row.id, hasRefetch);
  };

  // Column definitions (kept same as previous "All" view)
const columns = [
    {
        key: "companyName",
        label: "Company name",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.companyName}
                className="truncate block w-full">{row?.companyName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "profile",
        label: "Profile",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span 
                title={row?.profile}
                className="truncate block w-full">{row?.profile ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "YOERange",
        label: "YOE range",
        sortable: true,
        render: (row: AgencyJobsList) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span>{row?.YOEStart ?? "NA"}-{row?.YOEEnd ?? "NA"} years</span>
        </div>
        ),
    },
    {
        key: "salaryRange",
        label: "Salary range",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
               <span>{row?.salaryStart ?? "NA"} LPA - {row?.salaryEnd ?? "NA"} LPA</span>
            </div>
        ),
    },
    {
        key: "location",
        label: "Location",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.location ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "noticePeriod",
        label: "Notice Period",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.noticePeriod ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "dateAssigned",
        label: "Date assigned",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.dateAssigned}
                className="truncate block w-full">{row?.dateAssigned ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "uploadProfile",
        label: "Upload Profile",
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <button 
                onClick={()=>setIsProfileUploadModalOpen(true)}
                className="bg-blue-500 p-3 text-white rounded-xl flex flex-row gap-1 justify-center items-center">
                    <Upload/>
                    Upload profile
                </button>
            </div>
        ),
    },
    {
        key: "candidatesUploaded",
        label: "Candidates uploaded",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.candidatesUploaded ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "candidatesRejected",
        label: "Candidates rejected",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.candidatesRejected ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "candidatesInProcess",
        label: "Candidates in-process",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyJobsList) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.candidatesInProcess ?? "NA"}</span>
            </div>
        ),
    },
];

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

//   const renderExpandedDetails = (row: any) => {
// return (
//     <div className="flex justify-start items-start gap-8 p-4 bg-gray-50 rounded-lg">
//       <div>
//         <span className="font-semibold text-black">Last Rejection Date</span>
//         <p>
//           {row.lastRejectionDate
//             ? new Date(row.lastRejectionDate).toLocaleDateString("en-GB", {
//                 day: "numeric",
//                 month: "short",
//                 year: "numeric",
//               })
//             : "NA"}
//         </p>
//       </div>

//       <div>
//         <span className="font-semibold text-black">Rejected By</span>
//         <p>{row.rejectedBy ?? "NA"}</p>
//       </div>

//       <div>
//         <span className="font-semibold text-black">Cooling Period</span>
//         <p>{row.coolingPeriod ?? "NA"}</p>
//       </div>

//       <div className="max-w-sm">
//         <span className="font-semibold text-black">Rejection Reason</span>
//         <p className="break-words">{row.rejectedReason ?? "NA"}</p>
//       </div>
//     </div>
//   );
// };

  return (
    <>
      {/* Deselect button - only show when rows are selected */}
      <button
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${ListSelection?.selectedRows?.length === 0 ? "hidden" : ""}`}
        onClick={() => ListSelection.reset && ListSelection.reset()}
      >
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
        <span>deselect {ListSelection?.selectedRows?.length ?? 0} rows</span>
      </button>

        <DynamicTableAgency
        columns={columns}
        rows={sortedData ?? []}
        selectedRows={ListSelection?.selectedRows?.map((row: any) => row.id) ?? []}
        expandedRows={expandedRows}
        toggleSelectAll={() =>
            ListSelection.toggleSelectAll && ListSelection.toggleSelectAll(data)
        }
        toggleRow={(id: string) => {
            const row = data.find((r: any) => r.id === id);
            ListSelection.toggleRow && row && ListSelection.toggleRow(row);
        }}
        toggleExpand={toggleExpand}
        allSelected={
            ListSelection.getAllSelected && ListSelection.getAllSelected(sortedData)
        }
        // renderExpandedDetails={renderExpandedDetails}
        enableSelect={false}
        onSortChange={onSortChange}
        pageSize={10}
        setPageSize={() => {}}
        hasPrevPage={false}
        hasNextPage={false}
        handlePreviousPage={() => {}}
        handleNextPage={() => {}}
        />
        <UploadProfile
        dashboardType={"AGENCY"}
        onClose= {()=>setIsProfileUploadModalOpen(false)}
        isOpen={isProfileUploadModalOpen}
        userID={"12345"}
    />
    </>
  );
}
