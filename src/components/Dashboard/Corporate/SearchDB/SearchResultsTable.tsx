import React, { useState } from "react";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { AgencyDatabaseApplicantDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { RefreshCcw, LogOut } from 'lucide-react';
import { Edit, View } from "@AssetsFolder/assets";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";


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


export default function SearchResultsTable(props: any) {
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
  const [editProfileView,setEditProfileView] = useState<boolean>(false)
  const [editProfileData,setEditProfileData] = useState<AgencyDatabaseApplicantDetailsDto | undefined>()

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
  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: `database`,
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
        key: "candidateName",
        label: "Candidate Name",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.candidateName}
                className="truncate block w-full">{row?.candidateName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCompany",
        label: "Current Company",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.currentCompany ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email ID",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.emailId ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactNumber",
        label: "Contact no",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.contactNumber ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "coreSkills",
        label: "Core skills",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-start'>
                <span title={row?.coreSkills} className="truncate block w-full">{row?.coreSkills ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentDesignation",
        label: "Current Designation",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.currentDesignation}
                className="truncate block w-full">{row?.currentDesignation ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "YOE",
        label: "YOE",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto bc'>
            <span>{row?.YOE ?? "NA"}</span>
        </div>
        ),
    },
    {
    key: "source",
    label: "Source",
    sortable: true,
    render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span 
                title={row?.source}
                className="truncate block w-full">{row?.source ?? "NA"}</span>
        </div>
    ),
    },
    {
        key: "about",
        label: "About",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-start'>
                <span title={row?.about}className="truncate block w-full">{row?.about ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "CTC",
        label: "CTC",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.CTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "ECTC",
        label: "ECTC",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.ECTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "link",
        label: "CV link",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <a href={row?.cvLink} className="text-blue-400">Link</a>
            </div>
        ),
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
            <div className="flex justify-center m-auto gap-2">
            <div className="max-w-[150px]">
                <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-white px-3 py-2 text-xs hover:bg-blue-700 transition"
                >
                <RefreshCcw className="w-4 h-4 mt-1" />
                <span className="text-left leading-tight text-xs">
                    Find Matching <br />Score
                </span>
                </button>
            </div>
            <div className="max-w-[150px]">
                <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700 transition"
                >
                <LogOut className="w-4 h-4 mt-1" />
                <span className="text-left leading-tight text-xs">
                    Move to<br />applicants
                </span>
                </button>
            </div>
                {/* <button 
                    onClick={()=>{
                        setEditProfileView(true)
                        setEditProfileData(row)
                    }}>
                    <RefreshCcw/>
                </button>
                <button 
                    onClick={()=>{
                        setEditProfileView(true)
                        setEditProfileData(row)
                    }}>
                    <LogOut/>
                </button> */}
            </div>
        )}
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

        <DynamicTableTwo
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
        enableSelect={true}
        onSortChange={onSortChange}
        pageSize={10}
        setPageSize={() => {}}
        hasPrevPage={false}
        hasNextPage={false}
        handlePreviousPage={() => {}}
        handleNextPage={() => {}}
        />
    </>
  );
}
