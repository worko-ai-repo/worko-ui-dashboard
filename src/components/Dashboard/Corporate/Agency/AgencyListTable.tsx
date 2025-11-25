import React, { useState } from "react";
import { CircleMinus, CirclePause, CirclePlay, Clipboard, ClipboardCheck, Eye, Pause, Pencil, Trash2, User } from "lucide-react";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { AgencyListDetailsDto, AgencyDatabaseApplicantDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { Edit, View } from "@AssetsFolder/assets";
import AssignJobModal from "./modals/AssignJobModal";
import RemoveJobModal from "./modals/RemoveJobModal";
import EditAgencyModal, { FormValues } from "./modals/EditAgencyModal";
import PauseAgencyModal from "./modals/PauseAgencyModal";
import DeleteAgencyModal from "./modals/DeleteAgencyModal";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import Modal from "@Components/Shared/Modal";
import { newDisplayStatus, statusColors } from "@Components/Dashboard/Corporate/Applicants/ApplicantsTable";
import { JobApplicationStatusType } from "@TypesAndConstants/JobsAndApplication.type";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import { AwsS3FileUploadResponse } from "@Interfaces/Auth.dto";
  

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


export default function AgencyListTable(props: any) {
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
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");
  const [scorePointsModal, setScorePointsModal] = useState<any>();
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({ isOpen: false, applicant: {} as any, action: "EDIT" as "EDIT" | "VIEW" });
  const [editProfileView,setEditProfileView] = useState<boolean>(false)
  const [editProfileData,setEditProfileData] = useState<any>()
  const [feedbackModalOpen,setFeedbackModalOpen] = useState<boolean>(false)
  const [isAssignJobModelOpen,setIsAssignJobModelOpen] = useState<boolean>(false);
  const [isRemoveJobModelOpen,setIsRemoveJobModelOpen] = useState<boolean>(false);
  const [isEditAgencyModelOpen,setIsEditAgencyModelOpen] = useState<boolean>(false);
  const [isPauseAgencyModelOpen,setIsPauseAgencyModelOpen] = useState<boolean>(false);
  const [isDeleteAgencyModelOpen,setIsDeleteAgencyModelOpen] = useState<boolean>(false);
  const [isViewCVModalOpen,setIsViewCVModalOpen] = useState<boolean>(false);
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;

  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
      agencyName: ["agencyName"],
      email: ["email"],
      contactName: ["name"],
      contactNumber: ["phoneNumberDetails.number", "phoneNumberDetails.countryCode"],
      dateActivated: ["createdAt"],
      GSTIN: ["GSTIN"],
      status: ["inviteStatus"],
  };

  // const { sortedData, onSortChange } = useSortableData(data as any, keyFallbacks);
  const { sortedData, onSortChange } = useSortableData<AgencyListDetailsDto>(data, keyFallbacks, {
  tableId: `agency`,
  persistInUrl: true,
  persistInLocalStorage: false,
  defaultSort: null,
  });

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
        key: "agencyName",
        label: "Agency Name",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span 
                title={row?.agencyName}
                className="truncate block w-full">{row?.agencyName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email ID",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span title={row?.email}
                className="truncate block w-full">{row?.email ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactName",
        label: "Contact person name",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.name}
                className="truncate block w-full">{row?.name ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactNumber",
        label: "Ph no",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
              {row?.phoneNumberDetails?.countryCode && row?.phoneNumberDetails?.number
              ? <span>+{row?.phoneNumberDetails?.countryCode} {row?.phoneNumberDetails?.number}</span>
              : <span>{"NA"}</span>}     
            </div>
        ),
    },
    {
        key: "dateActivated",
        label: "Date activated",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
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
        key: "asignedJobs",
        label: "Assigned Jobs",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.totalAssignedJobs ?? "-"}</span>
            </div>
        ),
    },
    {
        key: "totalSubmitted",
        label: "Total submitted",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.totalCandidatesSubmitted ?? "-"}</span>
            </div>
        ),
    },
    {
        key: "totalRejected",
        label: "Total rejected",
        contentWidth: `max-w-none`,
        sortable: false,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.totalCandidateRejected ?? "-"}</span>
            </div>
        ),
    },
    {
        key: "totalHired",
        label: "Total hired",
        contentWidth: `max-w-none`,
        sortable: false,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto'>
                <span>{row?.totalCandidateHired ?? "-"}</span>
            </div>
        ),
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyListDetailsDto) => {
          if (row.inviteStatus === "AWAITING" || row.inviteStatus === "REJECTED") return null;
          return (
              <div className='flex justify-start m-auto gap-1'>
                  <div className="flex flex-row">
                      <button
                          className="btn-sky flex items-center space-x-2"
                          onClick={() => {
                          setIsAssignJobModelOpen(true)
                          setEditProfileData(row);
                          }}
                      >
                          <ClipboardCheck className="w-5 h-5 shrink-0" />
                          <span className="text-xs">Assign jobs</span>
                      </button>
                  </div>

                  <div className="flex flex-row">
                      <button className="btn-blue flex items-center space-x-2"
                          onClick={()=>{
                              setIsRemoveJobModelOpen(true)
                              setEditProfileData(row)
                          }}>
                          <CircleMinus className="w-5 h-5 shrink-0" />
                          <span className="text-xs">Remove jobs</span>
                      </button>
                  </div>

                  <button className="border rounded-lg p-2"
                      onClick={()=>{
                          setIsEditAgencyModelOpen(true)
                          setEditProfileData(row)
                      }}>
                      <Pencil className="w-5 h-5 shrink-0 rounded-sm" />
                  </button>

                  <button className="border rounded-lg p-2"
                      onClick={()=>{
                          setIsPauseAgencyModelOpen(true)
                          setEditProfileData(row)
                      }}>
                      {row?.isPaused ? 
                      <CirclePlay className="w-5 h-5 shrink-0" /> :
                      <CirclePause className="w-5 h-5 shrink-0" />}
                  </button>

                  <button 
                      disabled={row.isDelete}
                      className={`border rounded-lg p-2 ${
                        row.isDelete ? "text-gray-300 cursor-not-allowed" : "bg-red-500 text-white"
                      }`}
                      onClick={()=>{
                          setIsDeleteAgencyModelOpen(true)
                          setEditProfileData(row)
                      }}>
                      <Trash2 className="w-5 h-5 shrink-0" />
                  </button>
              </div>
          )}
    },
    {
        key: "GSTIN",
        label: "GSTIN no",
        sortable: true,
        render: (row: AgencyListDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.GSTIN ?? "-"}</span>
            </div>
        ),
    },
    {
        key: "contractCopy",
        label: "Contract copy",
        sortable: false,
        render: (row: AgencyListDetailsDto) => (
        row?.contractCopyAwsS3FileName && (
          <div className="flex justify-center m-auto w-[40px]">
            <button
              className="flex flex-row justify-center items-center"
              onClick={() => viewCV(row)}
            >
              <img
                src={View}
                alt="View"
                className="w-8 h-8 btn-sky shrink-0 cursor-pointer"
              />
            </button>
          </div>
        )
        )
    },
    {
      key: "status",
      label: "Current status",
      sortable: true,
      render: (row: AgencyListDetailsDto) => {
          const colorClass = statusColors[row.inviteStatus as JobApplicationStatusType] ?? "bg-gray-100 text-gray-500";

          return (
              <div className="flex justify-center  mx-auto p-2 w-fit relative">
              <span
                  className={`px-3 py-1 h-fit rounded-full text-xs font-medium overflow-visible  capitalize ${colorClass}`}>
                  {newDisplayStatus[row.inviteStatus as JobApplicationStatusType]}
              </span>
              </div>
          );
      },
    },
];

  const viewCV = async (row:AgencyListDetailsDto) =>{
    const payload = {
      companyId: row.companyId,
      agencyInviteId: row.id,
      contractCopyAwsS3FileName: row.contractCopyAwsS3FileName,
    }
    try {
      const {response} = await httpServiceObj.post<any>(`${agencyBaseUrl}/file/gsu2v/AGENCY_INVITE_CONTRACT_COPY`,payload,
        true,{},true,
      )
      setPdfViewDetails(response.objectUrl)
      setIsViewCVModalOpen(true)
    } catch (error) {
      console.log(error)
    }
  }

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
          enableSelect={false}
          onSortChange={onSortChange}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          handlePreviousPage={() => onPageChange(currentPage - 1)}
          handleNextPage={() => onPageChange(currentPage + 1)}
          hasPrevPage={currentPage > 1}
          hasNextPage={!!pagination?.lastKey}
        />
                
        <AssignJobModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsAssignJobModelOpen(false)}
          isOpen= {isAssignJobModelOpen}
          jobsList={jobsList}
          agencyData={editProfileData}
          userDetails={userDetails}
        />

        <RemoveJobModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsRemoveJobModelOpen(false)}
          isOpen= {isRemoveJobModelOpen}
          jobsList={jobsList}
          agencyData={editProfileData}
          userDetails={userDetails}
        />

        <EditAgencyModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsEditAgencyModelOpen(false)}
          isOpen= {isEditAgencyModelOpen}
          data={editProfileData}
          localUpdate={localUpdate}
        />

        <PauseAgencyModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsPauseAgencyModelOpen(false)}
          isOpen= {isPauseAgencyModelOpen}
          data={editProfileData}
          localUpdate={localUpdate}
        />

        <DeleteAgencyModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsDeleteAgencyModelOpen(false)}
          isOpen= {isDeleteAgencyModelOpen}
          localUpdate={localUpdate}
          data={editProfileData}
          removeAgencyLocally={removeAgencyLocally}
        />
        {/* <Modal
          isOpen={isViewCVModalOpen}
          onClose={() => {
            setIsViewCVModalOpen(false);
          }}
          className="w-[90vw] sm:max-w-4xl h-full">
          <CVPreviewWithoutActionButtons
            onClose={() => {
              setIsViewCVModalOpen(false);
            }}
            jobApplicationData={editProfileData}
          />
        </Modal> */}
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
