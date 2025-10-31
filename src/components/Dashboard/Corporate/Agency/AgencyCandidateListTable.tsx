import React, { useState } from "react";
import { Check, Eye, Pencil, RefreshCcw, Send, Trophy, User, X } from "lucide-react";
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
import ProgressCircle from "@Components/Shared/CircularBarAgency";
import { newDisplayStatus, statusColors } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { JobApplicationStatusType } from "@TypesAndConstants/JobsAndApplication.type";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import RejectCandidateModal from "./modals/RejectCandidateModal";


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


export default function AgencyCandidateListTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
    scoreLoading,
    localUpdate,
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
  const [feedbackModalOpen,setFeedbackModalOpen] = useState<boolean>(false)
  const [isAllExpanded, setIsAllExpanded] = React.useState(false);
  const [isRejecting,setIsRejecting] = useState<boolean>(false);
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
    email: ["emailId", "data.emailId", "email"],
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
        key: "jobProfile",
        label: "Job Profile",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span 
                title={row?.jobProfile}
                className="truncate block w-full">{row?.jobProfile ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "agencyName",
        label: "Agency Name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px] text-center'>
                <span 
                title={row?.agencyName}
                className="truncate block w-full">{row?.agencyName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "dateSubmitted",
        label: "Date Submitted",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[100px]'>
            <span>{row?.dateSubmitted ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "applicantName",
        label: "Applicant Name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
               <span 
                title={row?.applicantName}
                className="truncate block w-full">{row?.applicantName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email ID",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px] text-center'>
                <span 
                title={row?.emailId}
                className="truncate block w-full">{row?.emailId ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactNumber",
        label: "Contact number",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span>{row?.contactNumber ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCompany",
        label: "Current Company",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.currentCompany ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                title={row?.currentCompany}
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.currentCompany ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentDesignation",
        label: "Current designation",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span 
                title={row?.currentDesignation}
                className="truncate block w-full">{row?.currentDesignation ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "totalYOE",
        label: "Total YOE",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            // <div className='flex justify-center w-[100px]'>
            //     <span>{row?.totalYOE ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.totalYOE ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "relevantYOE",
        label: "Relevant YOE",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.relevantYOE ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.relevantYOE ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCTC",
        label: "CTC",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.currentCTC ?? "NA"}</span>
            </div>
            // <div className='flex w-[100px]'>
            //     <span>{row?.currentCTC ?? "NA"}</span>
            // </div>
        ),
    },
    {
        key: "expectedCTC",
        label: "ECTC",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            // <div className='flex justify-center w-[100px]'>
            //     <span>{row?.expectedCTC ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.expectedCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "noticePeriod",
        label: "Notice Period",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto  w-[100px]'>
                <span>{row?.noticePeriod ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "location",
        label: "Location",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span>{row?.location ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "readyToRelocate",
        label: "Ready to relocate",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto '>
            <span>{row?.readyToRelocate === true
                ? "Yes"
                : row?.readyToRelocate === false
                ? "No"
                : "NA"}
            </span>
        </div>
        ),
    },
    // {
    //     key: "anyComment",
    //     label: "Any comment",
    //     sortable: true,
    //     render: (row: AgencyDatabaseApplicantDetailsDto) => (
    //         <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
    //             <span 
    //             title={row?.comments}
    //             className={isAllExpanded ? "": "truncate block w-full"}>{row?.comments ?? "NA"}</span>
    //         </div>
    //     ),
    // },
    {
        key: "viewCV",
        label: "CV",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[40px]'>
            {/* <img src={View} className="w-7 h-7 btn-sky shrink-0" /> */}
            <a href={row.cvLink} target="_blank" rel="noopener noreferrer">
                <img src={View} className="w-8 h-8 btn-sky shrink-0" />
                {/* <Eye className="cursor-pointer hover:text-blue-500" /> */}
            </a>
        </div>
        )
    },
    {
        key: "workoScore",
        label: "Worko Score",
        contentWidth: `max-w-none`,
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center items-center m-auto'>
            {(row.score === undefined || row.score === null) ? (
            <button
                type="button"
                disabled={scoreLoading}
                className={`w-32 flex flex-row items-center justify-center gap-1 rounded-lg text-white transition text-center py-2
                    ${scoreLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-cyan-400 hover:bg-cyan-600"
                    }
                `}
                >
                <Trophy className="w-4 h-4" />
                <span className="leading-tight text-[10px] text-left">
                    {scoreLoading ? "Finding score..." : <>Find matching<br />score</>}
                </span>
            </button>
      ) : (
        <ProgressCircle
          onClick={() => {
            setFeedbackModalOpen(true);
            const application = jobApplicationServiceObj.getScoreDetails(row as any);
            if (application === null) return;
            setScorePointsModal({
              title: application.type === "SCORE",
              data: application.feedback,
              matchingScore: row.score ?? 0,
              candidateName: row.applicantName,
              details: true,
              showCloseButton: true,
              onClose: () => setFeedbackModalOpen(false),
            });
          }}
          value={row.score}
        />
      )}
    </div>
        )
    },
    {
        key: "action",
        label: "Action",
        contentWidth: `max-w-none`,
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
            <div className='flex justify-center m-auto gap-2 text-[10px]'>
                {/* <button 
                    onClick={()=>{
                        setEditProfileView(true)
                        setEditProfileData(row)
                    }}>
                    <img src={Edit} className="w-8 h-8 btn-sky shrink-0" />
                </button> */}
                <button
                type="button"
                className="w-32 flex flex-row items-center justify-center gap-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition text-center"
                >
                <Check className="w-6 h-6" />
                <span className="leading-tight text-[10px]">Accept & move<br />to applicant</span>
                </button>


            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 text-white text-xs hover:bg-white hover:text-red-500 transition border border-red-500 p-1 text-center"
              onClick={()=>{
                setIsRejecting(true)
                setEditProfileData(row)
              }}
            >
              <X className="w-8 h-8 flex items-center justify-center stroke-[2]" />
            </button>

            <button 
                type="button"
                className="w-32 flex flex-row items-center justify-center gap-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition text-center"
                >
                <Send className="w-4 h-4" />
                <span className="leading-tight text-[10px]">Accept & send<br />for evaluation</span>
            </button>
            </div>
        )}
    },
    {
        key: "status",
        label: "Current status",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.currentStatus ?? "NA"}</span>
            // </div>
            const colorClass =
                statusColors[row.currentStatus as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";
    
            return (
                <div className="flex justify-center  mx-auto p-2 w-fit relative">
                <span
                    className={`px-3 py-1 h-fit rounded-full text-xs font-medium overflow-visible  capitalize ${colorClass}`}>
                    {newDisplayStatus[row.currentStatus as JobApplicationStatusType]}
                </span>
                </div>
            );
        },
    },
    // {
    //     key: "achievements",
    //     label: "Achievements",
    //     sortable: true,
    //     render: (row: AgencyDatabaseApplicantDetailsDto) => (
    //         <div className={`flex justify-center m-auto ${isAllExpanded ? "" : "w-[100px]"}`}>
    //             <span 
    //             title={row?.achievements}
    //             className={isAllExpanded ? "": "truncate block w-full"}>{row?.achievements ?? "NA"}</span>
    //         </div>
    //     ),
    // },

];

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const renderExpandedDetails = (row: any) => {
    return (
    <div className="flex flex-col justify-start items-start gap-8 rounded-lg">
        <div className="flex gap-3">
            <div className="text-left w-[34.5em]">
            <span className="font-semibold text-blue-400 text-left">Career History</span>
                {row.careerHistory && row.careerHistory.length > 0 ? (
                    <div className="mt-2 space-y-2">
                    {row.careerHistory.map((career:any, index:number) => (
                        <div key={index} className="border-gray-700">
                        <p className="text-xs">{index+1} . {career.designation} at {career.companyName} . {career.duration}</p>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-400">NA</p>
                )}
            </div>
            <div className="text-left w-[34.5em]">
            <span className="font-semibold text-blue-400 text-left">Education</span>
                {row.educationHistory && row.educationHistory.length > 0 ? (
                    <div className="mt-2 space-y-2">
                    {row.educationHistory.map((education:any, index:number) => (
                        <div key={index} className="border-gray-700 pb-2">
                        <p className="text-xs">{index+1} . {education.degree}, {education.fieldOfStudy} from  {education.institution} {education.yearOfCompletion} {education.grade}</p>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-400">NA</p>
                )}
            </div>
        </div>
        

        {/* <div className="text-left">
            <span className="font-semibold text-blue-400 text-left">Education</span>
            <p className="break-words text-start w-[30em]">{row.educationHistory ?? "NA"}</p>
        </div> */}
    {/* <div>
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
    </div> */}
    <div className="flex gap-3">
        <div className="text-left space-y-2">
            <span className="font-semibold text-blue-400 text-left">Achivements</span>
            <p className="break-words text-start w-[34.5em]">{row.achievements ?? "NA"}</p>
        </div>
        <div className="text-left space-y-2">
            <span className="font-semibold text-blue-400 text-left">Any comments</span>
            <p className="break-words text-start w-[34.5em]">{row.comments ?? "NA"}</p>
        </div>
        </div>
    </div>
    );
};

  return (
    <>  
        <div className="flex flex-row gap-2">
            {/* <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2`}
                onClick={() => {
                      if (!toggleExpand) return;
                      const allExpanded = sortedData.length > 0 && expandedRows.length === sortedData.length;
                      if (allExpanded) {
                        expandedRows.forEach((id) => toggleExpand(id));
                      } else {
                        sortedData.forEach((r:any) => {
                          if (!expandedRows.includes(r.id)) toggleExpand(r.id);
                        });
                      }
                      setIsAllExpanded(!allExpanded);
                    }}
            >
                <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
                {expandedRows.length === sortedData.length ? '-' : '+'}
                </span>
                <span>{expandedRows.length === sortedData.length ? 'Collapse all' : 'Expand all'}</span>
            </button> */}

            {/* Deselect button - only show when rows are selected */}
            <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${ListSelection?.selectedRows?.length === 0 ? "hidden" : ""}`}
                onClick={() => ListSelection.reset && ListSelection.reset()}
            >
                <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
                <span>deselect {ListSelection?.selectedRows?.length ?? 0} rows</span>
            </button>
        </div>
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
        // mainColumns={["jobProfile","agencyName",'applicantName','email',"viewCV","workoScore","action","status"]}
        // expandedColumns={['currentCompany',"currentDesignation",'currentCTC','expectedCTC', 'totalYOE','relevantYOE', 'readyToRelocate','anyComment','achievements']}
        />
        <RejectCandidateModal
        onClose={()=>setIsRejecting(false)}
        isOpen={isRejecting}
        data={editProfileData}
        onRefresh={()=>alert("closed")}
        localUpdate={localUpdate}/>
    </>
  );
}
