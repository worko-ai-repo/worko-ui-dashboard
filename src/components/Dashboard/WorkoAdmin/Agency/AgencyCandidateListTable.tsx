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
import { AgencyAllCandidatesListDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { Edit, View } from "@AssetsFolder/assets";
import ProgressCircle from "@Components/Shared/CircularBarAgency";
import { newDisplayStatus, statusColors } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { JobApplicationStatusType } from "@TypesAndConstants/JobsAndApplication.type";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import httpServiceObj from "@Services/ApiHandler.service";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import Modal from "@Components/Shared/Modal";

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
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
  } = props as any;

  // State required for table interactions
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");
  const [scorePointsModal, setScorePointsModal] = useState<any>();
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({ isOpen: false, applicant: {} as any, action: "EDIT" as "EDIT" | "VIEW" });
  const [editProfileView,setEditProfileView] = useState<boolean>(false)
  const [editProfileData,setEditProfileData] = useState<AgencyAllCandidatesListDetailsDto | undefined>()
  const [feedbackModalOpen,setFeedbackModalOpen] = useState<boolean>(false)
  const [isAllExpanded, setIsAllExpanded] = React.useState(false);
  const [isViewCVModalOpen,setIsViewCVModalOpen] = useState<boolean>(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE

  // Sorting hook (keeps same fallback keys as before)
    const keyFallbacks = {
        jobProfile: ["jobDetails.jobTitle"],
        agencyName: ["agencyName"],
        dateSubmitted: ["createdAt"],
        applicantName: ["candidateParsedCvDetails.name"],
        email: ["candidateParsedCvDetails.email", "emailId", "data.emailId"],
        contactNumber: ["candidateParsedCvDetails.phoneNumberDetails.number"],
        currentCompany: ["candidateParsedCvDetails.currentCompany"],
        currentDesignation: ["candidateParsedCvDetails.currentDesignation"],
        totalYOE: ["candidateParsedCvDetails.totalYOE"],
        relevantYOE: ["candidateParsedCvDetails.relevantYOE"],
        currentCTC: ["candidateParsedCvDetails.currentCTC"],
        expectedCTC: ["candidateParsedCvDetails.expectedCTC"],
        noticePeriod: ["candidateParsedCvDetails.noticePeriod"],
        location: ["candidateParsedCvDetails.location"],
        readyToRelocate: ["candidateParsedCvDetails.readyToRelocate"],
        workoScore: ["score", "scoreDetails.matchingScore", "scoreDetails.matchingScorePercentage"],
        status: ["jobDetails.status"]
    };

    const { sortedData, onSortChange } = useSortableData<AgencyAllCandidatesListDetailsDto>(data, keyFallbacks, {
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

      const handlePageSizeChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
      if (typeof value === "number") {
        setPageSize(value);
        onPageSizeChange(value);
      } else {
        setPageSize((prev:any) => {
          const newValue = value(prev);
          onPageSizeChange(newValue);
          return newValue;
        });
      }
    };

  // Column definitions (kept same as previous "All" view)
const columns = [
    {
        key: "jobProfile",
        label: "Job Profile",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span 
                title={row?.jobDetails?.jobTitle}
                className="truncate block w-full">{row?.jobDetails?.jobTitle ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "agencyName",
        label: "Agency Name",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
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
        render: (row: AgencyAllCandidatesListDetailsDto) => (
       <div className='flex justify-center m-auto w-[100px]'>
            <span>
                {row?.createdAt
                  ? new Date(row.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "NA"}
            </span>
        </div>
        ),
    },
    {
        key: "applicantName",
        label: "Applicant Name",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
               <span 
                title={row?.candidateParsedCvDetails?.name}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.name ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email ID",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px] text-center'>
                <span 
                title={row?.candidateParsedCvDetails?.email}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.email ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactNumber",
        label: "Contact number",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
              {row?.candidateParsedCvDetails?.phoneNumberDetails?.countryCode && row?.candidateParsedCvDetails?.phoneNumberDetails?.number
              ? <span>+{row?.candidateParsedCvDetails?.phoneNumberDetails?.countryCode} {row?.candidateParsedCvDetails?.phoneNumberDetails?.number}</span>
              : <span>{"NA"}</span>}     
            </div>
        ),
    },
    {
        key: "currentCompany",
        label: "Current Company",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.currentCompany ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                title={row?.candidateParsedCvDetails?.currentCompany}
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.candidateParsedCvDetails?.currentCompany ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentDesignation",
        label: "Current designation",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span 
                title={row?.candidateParsedCvDetails?.currentDesignation}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.currentDesignation ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "totalYOE",
        label: "Total YOE",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            // <div className='flex justify-center w-[100px]'>
            //     <span>{row?.totalYOE ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.candidateParsedCvDetails?.totalYOE ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "relevantYOE",
        label: "Relevant YOE",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.relevantYOE ?? "NA"}</span>
            // </div>
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.candidateParsedCvDetails?.relevantYOE ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCTC",
        label: "CTC",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.candidateParsedCvDetails?.currentCTC ?? "NA"}</span>
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
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            // <div className='flex justify-center w-[100px]'>
            //     <span>{row?.expectedCTC ?? "NA"}</span>
            // </div>
           <div className={`flex ${isAllExpanded ? "" : "m-auto w-[100px]"}`}>
                <span 
                className={isAllExpanded ? "": "truncate block w-full"}>{row?.candidateParsedCvDetails?.expectedCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "noticePeriod",
        label: "Notice Period",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto  w-[100px]'>
                <span>{row?.candidateParsedCvDetails?.noticePeriod ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "location",
        label: "Location",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
            <div className='flex justify-center m-auto w-[100px]'>
                <span>{row?.candidateParsedCvDetails?.location ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "readyToRelocate",
        label: "Ready to relocate",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
        <div className='flex justify-center m-auto '>
            <span>{row?.candidateParsedCvDetails?.readyToRelocate === true
                ? "Yes"
                : row?.candidateParsedCvDetails?.readyToRelocate === false
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
    //     render: (row: AgencyAllCandidatesListDetailsDto) => (
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
        render: (row: AgencyAllCandidatesListDetailsDto) => (
        <div className='flex justify-center m-auto w-[40px]'>
                    <button
                    className="flex flex-row justify-center items-center"
                    onClick={()=>{
                    viewCV(row)
                    }}>
                    <img src={View} alt="View" className="w-8 h-8 btn-sky shrink-0 "/>
                    </button>
        </div>
        )
    },
    {
        key: "workoScore",
        label: "Worko Score",
        sortable: false,
        render: (row: AgencyAllCandidatesListDetailsDto) => (
        <div className='flex justify-center items-center m-auto'>
            <ProgressCircle
            onClick={() => {
                setFeedbackModalOpen(true);
                const application = jobApplicationServiceObj.getScoreDetails(row);
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
                // console.log("Matching Score Details:", scorePointsModal);
            }}
            value={row.score}
            />
        </div>
        )
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        render: (row: AgencyAllCandidatesListDetailsDto) => {
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
    {
        key: "status",
        label: "Current status",
        sortable: true,
        render: (row: AgencyAllCandidatesListDetailsDto) => {
            // <div className='flex justify-center m-auto w-[100px]'>
            //     <span>{row?.currentStatus ?? "NA"}</span>
            // </div>
            const colorClass =
                statusColors[row?.jobDetails?.status as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";
    
            return (
                <div className="flex justify-center  mx-auto p-2 w-fit relative">
                <span
                    className={`px-3 py-1 h-fit rounded-full text-xs font-medium overflow-visible  capitalize ${colorClass}`}>
                    {newDisplayStatus[row?.jobDetails?.status as JobApplicationStatusType]}
                </span>
                </div>
            );
        },
    },
    // {
    //     key: "achievements",
    //     label: "Achievements",
    //     sortable: true,
    //     render: (row: AgencyAllCandidatesListDetailsDto) => (
    //         <div className={`flex justify-center m-auto ${isAllExpanded ? "" : "w-[100px]"}`}>
    //             <span 
    //             title={row?.achievements}
    //             className={isAllExpanded ? "": "truncate block w-full"}>{row?.achievements ?? "NA"}</span>
    //         </div>
    //     ),
    // },

];

const viewCV = async (row:AgencyAllCandidatesListDetailsDto) =>{
        const payload = {
            companyId: row?.companyId,
            jobId:row?.jobId,
            agencyUserId: row?.agencyUserId,
            candidateCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName,
        }
        try {
        const {response} = await httpServiceObj.post<any>(`${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,payload,true,{},true,)
        setPdfViewDetails(response.objectUrl)
        setIsViewCVModalOpen(true)
        } catch (error) {
        console.log(error)
        }
    }
  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const renderExpandedDetails = (row: any) => {
    return (
    <div className="flex justify-start items-start gap-8 bg-gray-50 rounded-lg">
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
    <div className="text-left">
        <span className="font-semibold text-blue-400 text-left">Achivements</span>
        <p className="break-words text-start w-[30em]">{row.achievements ?? "NA"}</p>
    </div>
    <div className="text-left">
        <span className="font-semibold text-blue-400 text-left">Any comments</span>
        <p className="break-words text-start w-[30em]">{row.comments ?? "NA"}</p>
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
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        handlePreviousPage={() => onPageChange(currentPage - 1)}
        handleNextPage={() => onPageChange(currentPage + 1)}
        hasPrevPage={currentPage > 1}
        hasNextPage={!!pagination?.lastKey}
        // mainColumns={["jobProfile","agencyName",'applicantName','email',"viewCV","workoScore","action","currentStatus"]}
        // expandedColumns={['currentCompany',"currentDesignation",'currentCTC','expectedCTC', 'totalYOE','relevantYOE', 'readyToRelocate','anyComment','achievements']}
        />
        <Modal
          isOpen={isViewCVModalOpen}
          onClose={() => {
            setIsViewCVModalOpen(false);
          }}
          className="w-[90vw] sm:max-w-4xl h-full">
          {!pdfViewDetails ? (
            <NoDataPresent />
          ) : (
            <CVPreviewRaw pdfUrl={pdfViewDetails} onClose={() => setIsViewCVModalOpen(false)} />
          )}
        </Modal>
    </>
  );
}
