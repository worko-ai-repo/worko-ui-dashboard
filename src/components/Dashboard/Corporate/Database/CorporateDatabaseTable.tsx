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
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import Modal from "@Components/Shared/Modal";
import httpServiceObj from "@Services/ApiHandler.service";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";

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


export default function CorporateDatabaseTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
    localUpdate,
    removeAgencyLocally,
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
    jobsList
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
  const [isViewCVModalOpen,setIsViewCVModalOpen] = useState<boolean>(false)
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
    referredBy: ["referredBy"],
    refereeType: ["refereeType"],
    contact: ["candidateParsedCvDetails.phoneNumberDetails.number"],
    date: ["createdAt"],
    profileName: ["profileName", "candidateParsedCvDetails.name"],
    candidateName: ["candidateParsedCvDetails.name"],
    currentCompany: ["candidateParsedCvDetails.currentCompany"],
    currentDesignation: ["candidateParsedCvDetails.currentDesignation"],
    currentCTC: ["candidateParsedCvDetails.currentCTC"],
    expectedCTC: ["candidateParsedCvDetails.expectedCTC",],
    addedBy: ["addedBy"],
    noticePeriod: ["candidateParsedCvDetails.noticePeriod",],
    locationComfortable: ["candidateParsedCvDetails.location",],
    remark: ["remark", "remarks"],
  };

  const { sortedData, onSortChange } = useSortableData<AgencyDatabaseApplicantDetailsDto>(data, keyFallbacks, {
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
        key: "referredBy",
        label: "Referred by",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.referredBy}
                className="truncate block w-full">{row?.referredBy ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "refereeType",
        label: "Referee type",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span 
                title={row?.refereeType} 
                className="truncate block w-full">{row?.refereeType ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contact",
        label: "Contact Number",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
              {row?.phoneNumberDetails?.countryCode && row?.phoneNumberDetails?.number
              ? <span>+{row?.phoneNumberDetails?.countryCode} {row?.phoneNumberDetails?.number}</span>
              : <span>{"NA"}</span>}     
        </div>
        ),
    },
    {
        key: "date",
        label: "Date",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
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
        key: "profileName",
        label: "Profile name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.profileName}
                className="truncate block w-full">{row?.profileName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "candidateName",
        label: "Candidate Name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.candidateParsedCvDetails?.name}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.name ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCompany",
        label: "Current company",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.candidateParsedCvDetails?.currentCompany}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.currentCompany ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentDesignation",
        label: "Current Designation",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.candidateParsedCvDetails?.currentDesignation}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.currentDesignation ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "currentCTC",
        label: "CTC",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.candidateParsedCvDetails?.currentCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "expectedCTC",
        label: "ECTC",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.candidateParsedCvDetails?.expectedCTC ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "addedBy",
        label: "Added by",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span 
                title={row?.addedBy}
                className="truncate block w-full">{row?.addedBy ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "noticePeriod",
        label: "Notice period",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span 
                className="truncate block w-full">{row?.candidateParsedCvDetails?.noticePeriod ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "locationComfortable",
        label: "Location comfortable with",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span 
                title={row?.candidateParsedCvDetails?.location}
                className="truncate block w-full">{row?.candidateParsedCvDetails?.location ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "remark",
        label: "Remark",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.remark}
                className="truncate block w-full">{row?.remark ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "viewCV",
        label: "CV",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
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
        key: "action",
        label: "Action",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
            <div className='flex justify-center m-auto w-[40px]'>
                <button 
                    disabled={true}
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

  const viewCV = async (row:AgencyDatabaseApplicantDetailsDto) =>{
    setEditProfileData(row)
    if(row?.refereeType === "WORKO"){
      if(!row?.candidateParsedCvDetails?.userDetailId 
        || !row?.candidateParsedCvDetails?.cvAwsS3FileName
      ){
        toast.error("Missing details",getToastOptions({}))
        return
      }
      try {
        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${row?.candidateParsedCvDetails?.userDetailId}/${row?.candidateParsedCvDetails?.cvAwsS3FileName}/USER_RESUME`, true, {}, false, "BASE")

        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        setPdfViewDetails(response?.objectUrl)
        setIsViewCVModalOpen(true)
      } catch (error) {
        console.log(error)
      }
    }else if(row?.refereeType === "INTERNAL"){
      if(!row?.candidateParsedCvDetails?.companyId 
        || !row?.candidateParsedCvDetails?.cvAwsS3FileName
        || !row?.candidateParsedCvDetails?.corporateBulkJdId 
      ){
        toast.error("Missing details",getToastOptions({}))
        return
      }
      try {
        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${row?.candidateParsedCvDetails?.companyId}/${row?.candidateParsedCvDetails?.cvAwsS3FileName}/BULK_CVS`, true, { corporateBulkJdId:row?.candidateParsedCvDetails?.corporateBulkJdId }, false, "BASE")

        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        setPdfViewDetails(response?.objectUrl)
        setIsViewCVModalOpen(true)
      } catch (error) {
        console.log(error)
      }      
    }
    else{
      if(!row?.candidateParsedCvDetails?.companyId 
        || !row?.candidateParsedCvDetails?.jobId 
        || !row?.candidateParsedCvDetails?.agencyUserId 
        || !row?.candidateParsedCvDetails?.cvAwsS3FileName
      ){
        toast.error("Missing details",getToastOptions({}))
        return
      }
      const payload = {
        companyId: row?.companyId,
        jobId:row?.jobId,
        agencyUserId: row?.agencyUserId,
        candidateCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName,
      }
      try {
        const {response,error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,payload,true,{},true,)
        
        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        setPdfViewDetails(response.objectUrl)
        setIsViewCVModalOpen(true)
      } catch (error) {
        console.log(error)
      }
    }
  }

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const renderExpandedDetails = (row: any) => {
return (
    <div className="flex justify-start items-start gap-8 p-4 bg-gray-50 rounded-lg">
      <div className="text-left">
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

      <div className="text-left">
        <span className="font-semibold text-black">Rejected By</span>
        <p>{row.rejectedBy ?? "NA"}</p>
      </div>

      <div className="text-left">
        <span className="font-semibold text-black">Cooling Period</span>
        <p>{row.coolingPeriod ?? "NA"}</p>
      </div>

      <div className="max-w-xl text-left">
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
        />
        <EditProfileModal
        onClose={()=>{
            setEditProfileView(false)
            setEditProfileData(undefined)
        }}
        isOpen={editProfileView}
        candidateFullDetails={editProfileData}
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
            <CVPreviewRaw 
            pdfUrl={pdfViewDetails} 
            onClose={() => {
              setIsViewCVModalOpen(false)
              setEditProfileData(undefined)
            }} 
            candidateFullDetails={editProfileData}
            showDownload={true}/>
          )}
        </Modal>
    </>
  );
}
