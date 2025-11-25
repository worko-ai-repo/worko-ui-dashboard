import DatabaseDropdown from '@Components/Shared/DropDown/DatabaseDropdown';
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType, JobApplicationStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { Ban, Download, Forward, Pencil, Trash2, Upload,Eye } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CorporateDatabaseTable from './CorporateDatabaseTable';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import SearchBarAgency from '@Components/Shared/SearchBarAgency';
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import { useDashboardContext } from '@Context/Dashboard.context'
import httpServiceObj from '@Services/ApiHandler.service';
import { PaginationInfo } from '@Components/Dashboard/Candidate/Pages/Job/JobTypes';
import { AgencyListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';

interface CorporateDatabaseProps{

}

{/*
filter is happening from backend api 
pagination is happening from backend api
change the naming convention because mostly its copy pasted
sorting fallbacks needs to be changed as per database data
remove useless codes
icons needs to be changed
*/}

export const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 10,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};

export interface DatabaseListFilters {
  searchText?: string;
  companyId?: string;
  sortOrder?: "ascending" | "descending";
  userType?: string;
}

export interface DatabaseListApiResponse {
  data: AgencyListDetailsDto[];
  pagination: PaginationInfo;
  totalReferrals?: number;
  currentPage?: number;
  totalPages?: number;
  matchingScore?: number;
}

const CorporateDatabase:React.FC<CorporateDatabaseProps> = () => {
    const [searchBarText, setSearchBarText] = useState<string|null>("")
    const [apiStatus, setApiStatus] = useState<DatabaseStatusType>();
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isActionSelected,setIsActionSelected] = useState<boolean>(false);
    const [actionName,setactionName] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [isLoading,setIsLoading] = useState<boolean>(false)
    const { userDetails } = useAppContext();
    const { user, isLoadingUser } = useDashboardContext();
    const baseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
    const [fetchData, setFetchData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
    const [pageSize,setPageSize] = useState<number>(10);
    const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
    const [filters, setFilters] = useState<DatabaseListFilters>({});
    const paginationKeysRef = useRef<Record<number, string>>({1: "",});
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      function handleClickOutside(event:any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // useEffect(()=>{
    //     const fetchUserData = async () =>{
    //     if(!userDetails) {
    //       return
    //     }
    //     setIsLoading(true)
    //     const url = `${baseUrl}/agency-invite/${userDetails?.companyId}/`;
    //     try {
    //       const { response } = await httpServiceObj.get(url, true, {}, true);
    //       if(response){
    //         // const data = response as UserDetails[];
    //         setFetchData(response as any)
    //       }else{
    //         setFetchData(dummyData)
    //       }
    //     } catch (error) {
    //       console.error("Cannot fetch user details:", error);
    //       setFetchData(dummyData)
    //     } finally{
    //       setIsLoading(false)
    //     }
    // }
    // fetchUserData()
    // },[userDetails])

    const SourceFilterDropdown = [
        { label: "All", onClick: () => setApiStatus(undefined) },
        { label: "Blacklisted", onClick: () => setApiStatus("BLACKLISTED") },
        { label: "Under cooling period", onClick: () => setApiStatus("UNDER_COOLING_PERIOD") },
        { label: "Under processing", onClick: () => setApiStatus("UNDER_PROCESSING") },
    ];

    const StatusFilterDropdown = [
        { label: "All", onClick: () => setApiStatus(undefined) },
        { label: "Referral", onClick: () => setApiStatus("REFERRAL") },
        { label: "Internal", onClick: () => setApiStatus("INTERNAL") },
        { label: "Agency", onClick: () => setApiStatus("AGENCY") },
        { label: "Worko", onClick: () => setApiStatus("WORKO") },
    ];

const fetchDatabaseData = useCallback(
  async (
    page: number = 1,
    size: number = pageSize,
    lastKey: string = "",
    searchFilters = filters,
    isSearch = false,
    sortOrder = "desc",
    statusOverride?: DatabaseStatusType
  ) => {
    if (!userDetails?.email) return;

    setIsLoading(true);
    try {
      const url = `${agencyBaseUrl}/corporate-candidate-profile/`;
      const params: Record<string, any> = {
        companyId: userDetails?.companyId,
        includeCandidateParsedCvDetails: true,
        pageSize: size,
        lastKey,
        sortOrder,
      };

      // include filters if present
      if (searchBarText?.trim()) params.candidateEmail = searchBarText;
      if (searchFilters?.userType) params.userType = searchFilters.userType;

      // include status (apiStatus state or override if provided)
      if (typeof statusOverride !== "undefined") params.refereeType = statusOverride;
      else if (apiStatus) params.refereeType = apiStatus;

      const { response } = await httpServiceObj.get<DatabaseListApiResponse>(url, true, params, true);

      if (response) {
        setFetchData(response.data);
        if (response.pagination) {
          setPaginationInfo(response.pagination);

          if (isSearch || page === 1) {
            paginationKeysRef.current = { 1: "" };
            if (response.pagination.lastKey) {
              paginationKeysRef.current[2] = response.pagination.lastKey;
            }
          } else if (response.pagination.lastKey) {
            paginationKeysRef.current[page + 1] = response.pagination.lastKey;
          }
        }
      } else {
        console.error("Cannot fetch user details");
      }
    } catch (err) {
      console.error("Exception in fetchDatabaseData:", err);
    } finally {
      setIsLoading(false);
    }
  },
  [userDetails, pageSize, filters, apiStatus, searchBarText]
);

    useEffect(() => {
        if (userDetails?.email) {
          setCurrentPage(1);
          setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
          paginationKeysRef.current = { 1: "" };
          fetchDatabaseData(1, pageSize, "");
        }
      }, [userDetails, fetchDatabaseData, pageSize]);
    
        const searchInputRef = useRef<NodeJS.Timeout | null>(null);
      
        const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchBarText(e.target.value);
        };
    
      
        const handlePageChange = useCallback((page: number) => {
            const lastKey = paginationKeysRef.current[page] || "";
            
            setCurrentPage(page);
            fetchDatabaseData(page, pageSize, lastKey);
          },
          [fetchDatabaseData, pageSize]
        );
      
      
        const handlePageSizeChange = useCallback(
          (size: number) => {
            setPageSize(size);
            setCurrentPage(1);
            setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
            paginationKeysRef.current = { 1: "" };
            fetchDatabaseData(1, size, "");
          },
          [fetchDatabaseData]
        );
    
      const removeAgencyLocally = (id: string) => {
        setFetchData((prev:any) => prev?.filter((item:any) => item.id !== id));
      };

    const toggleRow = (row: any) => {
    setSelectedRows((prev) =>
      prev.some((r) => r.id === row.id)
        ? prev.filter((r) => r.id !== row.id)
        : [...prev, row]
    );
  };

    const toggleSelectAll = (rows: any[]) => {
        if (selectedRows.length === rows.length) setSelectedRows([]);
        else setSelectedRows(rows);
    };

    const getAllSelected = (rows: any[]) => selectedRows.length === rows.length;
    const reset = () => setSelectedRows([]);
    
    const refetch = () => {};
    const handleJobApplicationStatusUpdate = () => {};
    const handleSendToRecruiter = () => {};
    const onBulkUpdate = () => {};

    const ListSelection = {
    selectedRows,
    toggleSelectAll,
    toggleRow,
    getAllSelected,
    reset,
    };

    const handleBulkBan = () =>{
      console.log(fetchData)
      setFetchData((prevData:any) =>
        prevData.filter((candidate:any) =>
          !selectedRows.some((sel) => sel.id === candidate.id)
        )
      );
      setSelectedRows([])
    }

    const handleBulkDelete = () =>{
      console.log(fetchData)
      setFetchData((prevData:any) =>
        prevData.filter((candidate:any) =>
          !selectedRows.some((sel) => sel.id === candidate.id)
        )
      );
      setSelectedRows([])
    }

//     const handleBulkCVDownload = async() =>{
//         if (selectedRows.length === 0) {
//             toast.error("Please select at least one candidate to download CVs",getToastOptions({}));
//             return;
//         }
//         for (const row of selectedRows) {
//             if (row.cv) {
//             try {
//                 const response = await fetch(row.cv, { mode: "cors" });
//                 const blob = await response.blob();
//                 const url = window.URL.createObjectURL(blob);
//                 const link = document.createElement("a");
//                 link.href = url;
//                 link.setAttribute("download", `${row.candidateName || "CV"}.pdf`);
//                 document.body.appendChild(link);
//                 link.click();
//                 link.remove();
//                 window.URL.revokeObjectURL(url);
//             } catch (error) {
//                 console.error("Failed to download CV:", error);
//             }
//             }
//         }
// };

const handleBulkCVDownload = () => {
  selectedRows.forEach((file:any) => {
    console.log(file)
    const a = document.createElement('a');
    a.href = file.contractCopyAwsS3FileName;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
};

// multi upload files
  const handleButtonClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf"
    );

    if (pdfFiles.length !== files.length) {
      toast.error("Only PDF files are allowed.",getToastOptions({}));
      return;
    }
    const oversizedFiles = pdfFiles.filter((file) => file.size > 2 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Max limit for each CV is 2MB`,getToastOptions({}));
      return;
    }
    console.log(pdfFiles);
    const payload = pdfFiles
    const uploadResponse:any = await invitingAgency(payload);
    console.log(uploadResponse,"uploadResponse")
    if (!uploadResponse.success) {
      toast.error("File upload failed. Please try again.", getToastOptions({}));
      return; 
    }
    const payloadForAws = {
      companyId:userDetails?.companyId,
      agencyInviteId: uploadResponse.data.id,
      // fileName: contractFile.name,
      fileMimeType: "application/pdf",
    }
    const responseFromAws = await uploadContractToAws(payloadForAws);
    console.log(responseFromAws,"response from aws")
    if (!responseFromAws.success) {
      toast.error("Failed to upload contract copy", getToastOptions({}));
      return;
    }
  };

  const invitingAgency = async (payload: any) => {
    try {
      const { response } = await httpServiceObj.post(`${agencyBaseUrl}/agency-invite/`, payload, true, {}, true);
      if (response) {
        return { success: true, data: response };
      }
      return { success: false };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  };

  const uploadContractToAws = async (payload: any) => {
    try {
      const { response } = await httpServiceObj.post(`${agencyBaseUrl}/file/gsu2u/AGENCY_INVITE_CONTRACT_COPY`, payload, true, {}, true);
      if (response) {
        return { success: true, data: response };
      }
      return { success: false };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  };

  const createAgencyProfile = async (payload: any) => {
    try {
      const { response } = await httpServiceObj.patch(`${agencyBaseUrl}/agency-invite/`, payload, true, {}, true);
      if (response) {
        return { success: true, data: response };
      }
      return { success: false };
    } catch (error) {
      console.error("Agency creation failed:", error);
      return { success: false, error };
    }
  };

  return (
    <div>
<div className="flex flex-col lg:flex-row lg:items-center gap-1 sm:gap-1 w-full">
  {/* Search (Row 1 on mobile/tablet; left part on lg+) */}
  <div className="w-full lg:flex-1">
    <SearchBarAgency
      searchBarText={searchBarText}
      setSearchBarText={setSearchBarText}
      handleClick={() => console.log("as")}
    />
  </div>

  {/* Row 2 (mobile/tablet stacked): Bulk CV upload*/}
  <div className="w-full lg:w-auto flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-1">
    {/* Bulk upload - full width on mobile/tablet, auto on lg */}
    <div className="w-full lg:w-auto">
      <input
        type="file"
        accept="application/pdf"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full lg:w-auto flex-none inline-flex items-center justify-center gap-2 h-9 rounded-xl px-3 text-xs transition shadow-md bg-blue-600 text-white hover:bg-blue-700"
      >
        <Upload className="w-4 h-4 stroke-[3]" />
        <span>Bulk CV upload</span>
      </button>
    </div>
      </div>
  {/* Row 3 (mobile/tablet stacked): Source, Status */}
  <div className="w-full lg:w-auto flex flex-row gap-2 lg:flex-row lg:items-center lg:gap-1 ">
    {/* Source dropdown */}
    <div className="w-full lg:w-auto">
      <DatabaseDropdown
        selectTitle="Source"
        tooltipMessage="Filter by source"
        options={StatusFilterDropdown}
      />
    </div>

    {/* Status dropdown */}
    <div className="w-full lg:w-auto">
      <DatabaseDropdown
        selectTitle="Status"
        tooltipMessage="Filter by status"
        options={SourceFilterDropdown}
      />
    </div>
  </div>

  {/* Actions (Row 4 on mobile/tablet; right part on lg+) */}
  <div className="w-full lg:w-auto">
    <div className="flex flex-row gap-1 items-center justify-center overflow-x-auto lg:overflow-visible py-1">
      <button
        onClick={handleBulkBan}
        disabled={selectedRows.length < 1}
        type="button"
        data-tooltip-id="my-tooltip"
        data-tooltip-content={"Ban"}
        className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
      >
        <Ban className="w-4 h-4" />
      </button>

      <button
        onClick={handleBulkDelete}
        disabled={selectedRows.length < 1}
        type="button"
        data-tooltip-id="my-tooltip"
        data-tooltip-content={"Delete"}
        className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-red-500 hover:bg-red-500 hover:text-white"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => {
            if (selectedRows.length >= 1) setShowDropdown((prev) => !prev);
          }}
          disabled={selectedRows.length < 1}
          type="button"
          data-tooltip-id="my-tooltip"
          data-tooltip-content={"Action"}
          className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
        >
          <Forward className="w-5 h-6" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <button
              onClick={() => {
                setIsActionSelected(true);
                setactionName("Move to applicants");
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Move to applicants
            </button>
            <button
              onClick={() => {
                setIsActionSelected(true);
                setactionName("Move to bulk");
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Move for bulk matching
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleBulkCVDownload}
        disabled={selectedRows.length < 1}
        type="button"
        data-tooltip-id="my-tooltip"
        data-tooltip-content={"Download cv"}
        className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>

      <br />
        {isLoading ? (
        <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
        />
        ) : (
        <CorporateDatabaseTable
          data={fetchData}
          userType="CORPORATE"
          refetch={refetch}
          ListSelection={ListSelection}
          handleUpdate={handleJobApplicationStatusUpdate}
          sendApplicationToRecruiter={handleSendToRecruiter}
          isBulkEvaluation={!!selectedRows.length}
          onBulkUpdate={onBulkUpdate}
        />
        )}
    </div>
  )
}

export default CorporateDatabase