import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { DynamicTable } from "../../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { Edit, View } from "@AssetsFolder/assets";
import { AgencyDashboardList } from "@Interfaces/AgencyDashboardList.dto";

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


export default function InvitesListTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
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
  
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };

  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
    companyName: ["companyName"],
    senderName: ["senderName"],
    date: ["date"],
  };
  // const { sortedData, onSortChange } = useSortableData(data as any, keyFallbacks);
      const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
      tableId: `agency`,
      persistInUrl: true,
      persistInLocalStorage: false,
      defaultSort: null,
      });

  // Column definitions (kept same as previous "All" view)
  const columns = [
    {
        key: "companyName",
        label: "Company name",
        sortable: true,
        render: (row: AgencyDashboardList) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span 
                title={row?.companyName}
                className="truncate block w-full">{row?.companyName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "senderName",
        label: "Sender name(HR)",
        sortable: true,
        render: (row: AgencyDashboardList) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span title={row?.senderName}
                className="truncate block w-full">{row?.senderName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "date",
        label: "Date",
        sortable: true,
        render: (row: AgencyDashboardList) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.date}
                className="truncate block w-full">{row?.date ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyDashboardList) => {
        return (
            <div className='flex justify-center m-auto gap-1'>
                <button className="border rounded-lg p-2 bg-green-600 text-white"
                    onClick={()=>{
                        setIsEditAgencyModelOpen(true)
                        setEditProfileData(row)
                    }}>
                    <Check className="w-3 h-3 shrink-0 rounded-sm" />
                </button>

                <button className="border rounded-lg p-2 bg-red-600 text-white"
                    onClick={()=>{
                        setIsPauseAgencyModelOpen(true)
                        setEditProfileData(row)
                    }}>
                    <X className="w-3 h-3 shrink-0" />
                </button>
            </div>
        )}
    },
];

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
        enableSelect={false}
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
