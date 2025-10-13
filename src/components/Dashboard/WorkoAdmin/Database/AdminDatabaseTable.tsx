import React, { useState } from "react";
import { Eye, Pencil, User } from "lucide-react";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { AgencyDatabaseApplicantDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { Edit, View } from "@AssetsFolder/assets";
import EditProfileModal from "./modals/EditProfileModal";

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


export default function AdminDatabaseTable(props: any) {
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
  const { sortedData, onSortChange } = useSortableData(data as any, keyFallbacks);

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
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.candidateName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "candidateEmail",
        label: "Email",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span className="truncate block w-full">{row?.candidateEmail ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contact",
        label: "Contact Number",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span>{row?.contactNumber ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "currentDesignation",
        label: "Current Designation",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.currentDesignation ?? "NA"}</span>
            </div>
        ),
    },
        {
        key: "appliedCompany",
        label: "Applied Company",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.appliedCompany ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCTC",
        label: "Current CTC",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.currentCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "expectedCTC",
        label: "Expected CTC",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.expectedCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "noticePeriod",
        label: "Notice Period",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.noticePeriod ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentLocation",
        label: "Current location",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.locationComfortableWith ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "addedBy",
        label: "Added by",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span>{row?.addedBy ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "addedFor",
        label: "Added for",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.addedFor ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "coolingPeriod",
        label: "Cooling period",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.coolingPeriod ?? "NA"}</span>
            </div>
        ),
    },
        {
        key: "lastActive",
        label: "Last active",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.lastActive ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "YOE",
        label: "YOE",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span>{row?.YOE ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "viewCV",
        label: "CV",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[40px]'>
            {/* <img src={View} className="w-7 h-7 btn-sky shrink-0" /> */}
            <a href={row.cv} target="_blank" rel="noopener noreferrer">
                <img src={View} className="w-8 h-8 btn-sky shrink-0" />
                {/* <Eye className="cursor-pointer hover:text-blue-500" /> */}
            </a>
        </div>
        )
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
            <div className='flex justify-center m-auto w-[40px]'>
                <button 
                    onClick={()=>{
                        setEditProfileView(true)
                        setEditProfileData(row)
                    }}>
                    {/* <Pencil/> */}
                    <img src={Edit} className="w-8 h-8 btn-sky shrink-0" />
                </button>
            </div>
        )}
    },
];

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const renderExpandedDetails = (row: any) => {
return (
    <div className="flex justify-start items-start gap-8 p-4 bg-gray-50 rounded-lg">
      <div>
        <span className="font-semibold text-black">Last Rejection Date</span>
        <p>
          {row.lastRejectionDate
            ? new Date(row.lastRejectionDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "NA"}
        </p>
      </div>

      <div>
        <span className="font-semibold text-black">Rejected By</span>
        <p>{row.rejectedBy ?? "NA"}</p>
      </div>

      <div>
        <span className="font-semibold text-black">Cooling Period</span>
        <p>{row.coolingPeriod ?? "NA"}</p>
      </div>

      <div className="max-w-sm">
        <span className="font-semibold text-black">Rejection Reason</span>
        <p className="break-words">{row.rejectedReason ?? "NA"}</p>
      </div>
    </div>
  );
};

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

        <DynamicTable
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
        renderExpandedDetails={renderExpandedDetails}
        enableSelect={true}
        onSortChange={onSortChange}
        pageSize={10}
        setPageSize={() => {}}
        hasPrevPage={false}
        hasNextPage={false}
        handlePreviousPage={() => {}}
        handleNextPage={() => {}}
        />
        <EditProfileModal
        onClose={()=>{
            setEditProfileView(false)
            setEditProfileData(undefined)
        }}
        isOpen={editProfileView}
        fullDetails={editProfileData}
        />
    </>
  );
}
