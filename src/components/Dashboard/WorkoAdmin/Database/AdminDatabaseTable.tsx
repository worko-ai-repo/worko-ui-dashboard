import React, { useMemo, useState } from "react";
import { Eye, Pencil, User } from "lucide-react";
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
import httpServiceObj from "@Services/ApiHandler.service";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import Modal from "@Components/Shared/Modal";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";

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
  const cvDownloadedEntry = row.statusTracker?.find(
    (entry: any) => entry.newStatus === "CV_DOWNLOADED"
  );
  const isUserIdTypeULID =
    cvDownloadedEntry?.userId?.length === 26 || cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID
    ? { updatedByUserId: cvDownloadedEntry?.userId || "" }
    : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
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
    localUpdate,
    removeAgencyLocally,
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
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({
    isOpen: false,
    applicant: {} as any,
    action: "EDIT" as "EDIT" | "VIEW",
  });
  const [editProfileView, setEditProfileView] = useState<boolean>(false);
  const [editProfileData, setEditProfileData] = useState<
    AgencyDatabaseApplicantDetailsDto | undefined
  >();
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState<boolean>(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;

  // Sorting hook (keeps same fallback keys as before)
const keyFallbacks = {
  candidateName: ["candidateParsedCvDetails.name"],
  email: ["candidateParsedCvDetails.email"],
  contact: ["phoneNumberDetails.number"],
  currentDesignation: ["candidateParsedCvDetails.currentDesignation",],
  currentLocation: ["candidateParsedCvDetails.location"],
  noticePeriod: ["candidateParsedCvDetails.noticePeriod"],
  YOE: ["candidateParsedCvDetails.totalYOE",],
  currentCTC: ["candidateParsedCvDetails.currentCTC",],
  expectedCTC: ["candidateParsedCvDetails.expectedCTC",],
  appliedCompany: [ "appliedCompaniesSortValue",],
  addedBy: ["addedBy"],
  addedFor: ["addedFor"],
  coolingPeriod: ["coolingPeriod"],
  lastActive: ["lastActive"],
};

  const sortableData = useMemo(() => {
    return (data ?? []).map((row:any) => ({
        ...row,
        appliedCompaniesSortValue: row.candidateProfileInCompanies
        ?.map((s:any) => s.companyName)
        // .sort()
        .join(", ")
        .toLowerCase() || "",
    }));
  }, [data]);

    //below instead of data we used sortableData cause applied companies need to be looped 
  const { sortedData, onSortChange } = useSortableData<AgencyDatabaseApplicantDetailsDto>(sortableData, keyFallbacks, {
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
    setDropdownVisibleRows((prev) =>
      prev.includes(rowIndex) ? prev.filter((id) => id !== rowIndex) : [...prev, rowIndex]
    );
  };

  const isDropdownVisible = (rowIndex: string) => dropdownVisibleRows.includes(rowIndex);

  const statusArray = [
    "APPLIED",
    "CV_DOWNLOADED",
    "UNDER_EVALUATION",
    "PROCESSING_INTERVIEW",
    "INTERVIEW_DONE",
    "HIRED",
    "REJECTED",
  ];

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
      setPageSize((prev: any) => {
        const newValue = value(prev);
        onPageSizeChange(newValue);
        return newValue;
      });
    }
  };

  // Column definitions (kept same as previous "All" view)
  const columns = [
    {
      key: "candidateName",
      label: "Candidate Name",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.name ?? "NA"
      //   (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.candidateParsedCvDetails?.name} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.name ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => 
        row?.candidateParsedCvDetails?.email ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px] text-center">
      //     <span title={row?.candidateParsedCvDetails?.email} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.email ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "contact",
      label: "Contact Number",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => 
        `+${row?.phoneNumberDetails?.countryCode} ${row?.phoneNumberDetails?.number}`
      //   (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     {row?.phoneNumberDetails?.countryCode && row?.phoneNumberDetails?.number ? (
      //       <span>
      //         +{row?.phoneNumberDetails?.countryCode} {row?.phoneNumberDetails?.number}
      //       </span>
      //     ) : (
      //       <span>{"NA"}</span>
      //     )}
      //   </div>
      // ),
    },
    {
      key: "currentDesignation",
      label: "Current Designation",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.currentDesignation ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span
      //       title={row?.candidateParsedCvDetails?.currentDesignation}
      //       className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.currentDesignation ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "appliedCompany",
      label: "Applied Companies",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => {
        const companyList = (row?.candidateProfileInCompanies?? [])
        .map(company => company.companyName)
        .join(", ");
        return (
          <div>
              <span 
                data-tooltip-id="my-tooltip"
                data-tooltip-content={companyList}
                data-tooltip-place="top"
                className="truncate block w-full">
                {companyList.length ? companyList: "NA"}
              </span>
          </div>)
          }
    },
    {
      key: "currentCTC",
      label: "CTC",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
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
        <div className="flex justify-center m-auto">
          <span>{row?.candidateParsedCvDetails?.expectedCTC ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "noticePeriod",
      label: "Notice period",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span className="truncate block w-full">
            {row?.candidateParsedCvDetails?.noticePeriod ?? "NA"}
          </span>
        </div>
      ),
    },
    {
      key: "currentLocation",
      label: "Current location",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.location ?? "NA"
      // (
      //   <div className="flex justify-center m-auto">
      //     <span title={row?.candidateParsedCvDetails?.location} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.location ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "addedBy",
      label: "Added by",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.addedBy ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.addedBy} className="truncate block w-full">
      //       {row?.addedBy ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "addedFor",
      label: "Added for",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.addedFor ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.addedFor} className="truncate block w-full">
      //       {row?.addedFor ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "coolingPeriod",
      label: "Cooling period companies",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.coolingPeriod ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "lastActive",
      label: "Last active",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto w-[150px]">
          <span>{row?.lastActive ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "YOE",
      label: "YOE",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.candidateParsedCvDetails?.totalYOE ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "viewCV",
      label: "CV",
      sortable: false,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto w-[40px]">
          <button
            data-tooltip-id="my-tooltip"
            data-tooltip-content="View CV"
            data-tooltip-place="top"
            className="flex flex-row justify-center items-center"
            onClick={() => {
              viewCV(row);
            }}>
            <img src={View} alt="View" className="w-8 h-8 btn-sky shrink-0 " />
          </button>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: false,
      render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
          <div className="flex justify-center m-auto w-[40px]">
            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Edit details"
              data-tooltip-place="top"
              disabled={true}
              onClick={() => {
                setEditProfileView(true);
                setEditProfileData(row);
              }}>
              {/* <Pencil/> */}
              <img src={Edit} className="w-8 h-8 btn-sky shrink-0" />
            </button>
          </div>
        );
      },
    },
  ];

  const viewCV = async (row:AgencyDatabaseApplicantDetailsDto) =>{
    setEditProfileData(row)
    if(row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "USER_RESUME"){
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
      }else if(row?.candidateParsedCvDetails?.cvAwsS3ResourceType  === "BULK_CVS"){
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
      }else{
        if(!row?.candidateParsedCvDetails?.companyId 
          || !row?.candidateParsedCvDetails?.jobId 
          || !row?.candidateParsedCvDetails?.agencyUserId 
          || !row?.candidateParsedCvDetails?.cvAwsS3FileName
          || !row?.candidateParsedCvDetails?.cvAwsS3FilePath
        ){
          toast.error("Missing details",getToastOptions({}))
          return
        }
        const splittedCvAwsS3FilePath = row?.candidateParsedCvDetails?.cvAwsS3FilePath.split("/")
        const jobIdFromCvAwsS3FilePath = splittedCvAwsS3FilePath[splittedCvAwsS3FilePath.length-2]
        
        const payload = {
          companyId: row?.candidateParsedCvDetails?.companyId,
          jobId:jobIdFromCvAwsS3FilePath,
          agencyUserId: row?.candidateParsedCvDetails?.agencyUserId,
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
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${
          ListSelection?.selectedRows?.length === 0 ? "hidden" : ""
        }`}
        onClick={() => ListSelection.reset && ListSelection.reset()}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
          &minus;
        </span>
        <span>deselect {ListSelection?.selectedRows?.length ?? 0} rows</span>
      </button>

      <NewDynamicTable
        columns={columns}
        rows={sortedData ?? []}
        selectedRows={ListSelection?.selectedRows?.map((row: any) => row.id) ?? []}
        expandedRows={expandedRows}
        toggleSelectAll={() => ListSelection.toggleSelectAll && ListSelection.toggleSelectAll(data)}
        toggleRow={(id: string) => {
          const row = data.find((r: any) => r.id === id);
          ListSelection.toggleRow && row && ListSelection.toggleRow(row);
        }}
        toggleExpand={toggleExpand}
        allSelected={ListSelection.getAllSelected && ListSelection.getAllSelected(sortedData)}
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
        onClose={() => {
          setEditProfileView(false);
          setEditProfileData(undefined);
        }}
        isOpen={editProfileView}
        fullDetails={editProfileData}
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
              setIsViewCVModalOpen(false);
              setEditProfileData(undefined);
            }}
            candidateFullDetails={editProfileData}
            showDownload={true}
          />
        )}
      </Modal>
    </>
  );
}
