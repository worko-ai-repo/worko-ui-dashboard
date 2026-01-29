import DatabaseDropdown from '@Components/Shared/DropDown/DatabaseDropdown';
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType, JobApplicationStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { Ban, Download, Forward, Pencil, Trash2, Upload,Eye, User } from 'lucide-react';
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
import SelectJobForBulkMatch from './modals/SelectJobForBulkMatchModal';
import AddEmailForReferralModal from './modals/AddEmailForReferralModal';
import EmailAddedModal from './modals/EmailAddedModal';
import CandidateBulkBanModal from './modals/CandidateBulkBanModal';
import { HiringEligibilityStatus, RefereeTypeStatus } from '@TypesAndConstants/JobsAndApplication.type';

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

interface ResponseApi {
  isSuccess:boolean;
}
const CorporateDatabase:React.FC<CorporateDatabaseProps> = () => {
    const [searchBarText, setSearchBarText] = useState<string|null>("")
    const [refereeTypeStatus, setRefereeTypeStatus] = useState<RefereeTypeStatus>();
    const [hiringEligibiltyStatus, setHiringEligibiltyStatus] = useState<HiringEligibilityStatus>();
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isActionSelected,setIsActionSelected] = useState<boolean>(false);
    const [actionName,setactionName] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [isLoading,setIsLoading] = useState<boolean>(false)
    const { userDetails } = useAppContext();
    const { user, isLoadingUser } = useDashboardContext();
    const [fetchData, setFetchData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
    const [pageSize,setPageSize] = useState<number>(200);
    const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
    const [filters, setFilters] = useState<DatabaseListFilters>({});
    const paginationKeysRef = useRef<Record<number, string>>({1: "",});
    const [currentPage, setCurrentPage] = useState(1);
    const [isSelectJobForBulkMatch,setIsSelectJobForBulkMatch] = useState<boolean>(false);
    const [loader, setLoader] = useState(false);
    const [isBulkCVDownloading,setIsBulkCVDownloading] = useState(false)
    const [isEmailForReferralOpen,setIsEmailForReferralOpen] = useState<boolean>(false);
    const [isCorporateAdmin, setIsCorporateAdmin] = useState<boolean>(false);
    const [isEmailAddedSuccessfully,setIsEmailAddedSuccessfully] = useState<boolean>(false);
    const [forwardingMailId,setForwardingMailId] = useState<string>("");
    const [submittedMailId,setSubmittedMailId] = useState<string>("");

    const [reason,setReason] = useState<string>("");
    const [comments,setComments] = useState<string>("");
    const [isCandidateBulkBanModelOpen,setIsCandidateBulkBanModelOpen] = useState<boolean>(false);
    const [isBulkBanSubmitting,setIsBulkBanSubmitting] = useState<boolean>(false);
    
    useEffect(() => {
      function handleClickOutside(event:any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(()=>{
      userDetails?.userType.map((userType:string) =>{
          if(userType === "corporate-admin"){
              setIsCorporateAdmin(true)
          }
      })
    },[userDetails])

  const SourceFilterDropdown = [
    { label: "All", onClick: () => setHiringEligibiltyStatus(undefined) },
    { label: "Blacklisted", onClick: () => setHiringEligibiltyStatus("BLACK_LISTED") },
    { label: "Under cooling period", onClick: () => setHiringEligibiltyStatus("UNDER_COOLING_PERIOD") },
    // { label: "Active", onClick: () => setHiringEligibiltyStatus("ACTIVE") },
  ];

  const StatusFilterDropdown = [
    { label: "All", onClick: () => setRefereeTypeStatus(undefined) },
    { label: "Referral", onClick: () => setRefereeTypeStatus("REFERRAL") },
    { label: "Internal", onClick: () => setRefereeTypeStatus("INTERNAL") },
    { label: "Agency", onClick: () => setRefereeTypeStatus("AGENCY") },
    { label: "Worko", onClick: () => setRefereeTypeStatus("WORKO") },
  ];

const fetchDatabaseData = useCallback(
  async (
    page: number = 1,
    size: number = pageSize,
    lastKey: string = "",
    searchFilters = filters,
    isSearch = false,
    sortOrder = "desc",
    // statusOverride?: DatabaseStatusType
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

      // include status hiringEligibilityStatus if provided
      if (hiringEligibiltyStatus !== undefined) params.hiringEligibilityStatus  = hiringEligibiltyStatus

      // include status refereeTypeStatus if provided)
      if (refereeTypeStatus !== undefined) params.refereeType  = refereeTypeStatus

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
  [userDetails, pageSize, filters, hiringEligibiltyStatus, refereeTypeStatus,searchBarText]
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

    const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
      setFetchData((prevData:any) => {
      if (!prevData || !Array.isArray(prevData)) return prevData;
  
      return prevData.map(job =>
        job.id === jobId ? { ...job, ...updatedData } : job
      );
      });
    }, []);

    const handleBulkBan = async() =>{
      if(!reason){
        toast.error("Please select a reason to continue",getToastOptions({}))
        return
      }
      if(!comments){
        toast.error("Please add detailed comments to continue",getToastOptions({}))
        return
      }
      const checkingAlreadyBanned = selectedRows.some(row => row?.hiringEligibilityStatus === "BLACK_LISTED");
      if(checkingAlreadyBanned){
        toast.error("Some of the selected candidates are already banned",getToastOptions({}))
        return
      }
      try {
        setIsBulkBanSubmitting(true)
        const onlyId = selectedRows.map(details =>{
          return details?.id
        })
        const payload = {
          reasonForBlacklisting:reason,
          detailedReasonForBlacklisting:comments,
          corporateCandidateProfileIds: onlyId,
        }
        const {response,error} = await httpServiceObj.patch<ResponseApi>(`${agencyBaseUrl}/corporate-candidate-profile/blacklist/bulk`,payload,true,{},true)
        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        if(response?.isSuccess){
          toast.success("Banned successfully",getToastOptions({}))
          setIsCandidateBulkBanModelOpen(false)
          setReason("")
          setComments("")

          //local update
          setFetchData((prevData) =>
            prevData.map((candidate) =>
              selectedRows.some((sel) => sel.id === candidate.id)
                ? { ...candidate, hiringEligibilityStatus: "BLACK_LISTED" }
                : candidate
            )
          );

          setSelectedRows([])
          return
        }
      } catch (error) {
        console.log(error)
      } finally {
        setIsBulkBanSubmitting(false)
      }
    }

// multi upload files
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 1000) {
      toast.error("You can upload a maximum of 1000 CVs at a time.", getToastOptions({}));
      return;
    }

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

    const chunkSize = 50;

    for (let i = 0; i < pdfFiles.length; i += chunkSize) {
    const currentChunk = pdfFiles.slice(i, i + chunkSize);

    const pdfFilesNameAndType  = currentChunk.map(file =>{
      return {
        fileMimeType:file.type,
        fileName:file.name
      }
    })
    const payload = {
      companyId: userDetails?.companyId,
      bulkCvs:pdfFilesNameAndType
    }
    const uploadResponse:any = await createFileRecords(payload);
    if (!uploadResponse.success) {
      toast.error("File upload failed. Please try again.", getToastOptions({}));
      return; 
    }

    const fileMap = new Map(
      currentChunk.map(file => [file.name, file])
    );

    await Promise.all(
      uploadResponse.data.bulkCvs.map(async (object: any) => {
        const file = fileMap.get(object.userFileName);
        if (!file) {
          throw new Error(`File mismatch: ${object.userFileName}`);
        }

        const payloadForAws = {
          companyId: userDetails?.companyId,
          candCvAwsS3FileName: object.cloudFileName,
        };

        const responseFromAws = await uploadFileToAws(object?.awsS3SignedUrl, file, object?.fileMimeType);

        // if (!responseFromAws.success) {
        //   toast.error(`Failed to upload ${object.cloudFileName}`, getToastOptions({}));
        //   throw new Error("Upload failed");
        // }

        return responseFromAws;
      })
    );
    }
    toast.success("Files uploaded successfully", getToastOptions({}));

    const lastKeyForCurrentPage = paginationKeysRef.current[currentPage] || "";

    fetchDatabaseData(
      currentPage,
      pageSize,
      lastKeyForCurrentPage
    );
    } catch (error: any) {
    toast.error(
      `Upload failed for ${error.message || "one or more files"}`,
      getToastOptions({})
    );
    } finally {
      // resetting after uploading a cv same cv with same name was not uploading because its already there in ref
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const createFileRecords = async (payload: any) => {
    try {
      const { response } = await httpServiceObj.post(`${agencyBaseUrl}/corporate-candidate-profile/resumes`, payload, true, {}, true);
      if (response) {
        return { success: true, data: response };
      }
      return { success: false };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error };
    }
  };

  const uploadFileToAws = async (url:any,file:any,contentType: any) => {
    try {
      const response = await fetch(url, {method: "PUT", body: file,
        headers: {
          "Content-Type": contentType,
        },
      });
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
        {loader && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[101]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-100">Loading please wait...</span>
            </div>
        )}
      {/* Search (Row 1 on mobile/tablet; left part on lg+) */}
      <div className="w-full lg:flex-1">
        <SearchBarAgency
          searchBarText={searchBarText}
          setSearchBarText={setSearchBarText}
          handleClick={() => console.log("")}
          placeholder="Search candidates by name, email and company name"
        />
      </div>

      {/* Row 2 (mobile/tablet stacked): Bulk CV upload*/}
      <div className='flex gap-1 mt-1 sm:mt-0 md:mt-0'>
        <div className="basis-[40%] w-full lg:w-auto flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-1">
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
      </div>

      {/* Actions (Row 4 on mobile/tablet; right part on lg+) */}
      <div className="w-full lg:w-auto">
        <div className="flex flex-row gap-1 items-center justify-center overflow-x-auto lg:overflow-visible">
        {isCorporateAdmin &&         
          <button
            onClick={()=>setIsEmailForReferralOpen(true)}
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Add email for referral"}
            className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
          >
            <User className="w-4 h-4" strokeWidth={4}/>
          </button>}

          <button
            onClick={()=>setIsCandidateBulkBanModelOpen(true)}
            disabled={selectedRows.length < 1}
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Ban"}
            className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
          >
            <Ban className="w-4 h-4" strokeWidth={4}/>
          </button>

          {/* <button
            onClick={handleBulkDelete}
            // disabled={selectedRows.length < 1}
            disabled={true}
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Delete"}
            className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-red-500 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2}/>
          </button> */}

          <div className="relative inline-block" ref={dropdownRef}>
            <button
              onClick={() => {
                if (selectedRows.length >= 1) setShowDropdown((prev) => !prev);
              }}
              disabled={selectedRows.length < 1}
              // disabled={true}
              type="button"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Move to applicants"}
              className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
            >
              <Forward className="w-5 h-6" strokeWidth={3}/>
            </button>

            {/* {showDropdown && (
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
                    setIsSelectJobForBulkMatch(true)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Move for bulk matching
                </button>
              </div>
            )} */}
          </div>

          {/* <button
            // onClick={handleBulkCVDownload}
            // disabled={selectedRows.length < 1 || isBulkCVDownloading}
            disabled={true}
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Download cv"}
            className={`flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md 
              ${isBulkCVDownloading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-white text-blue-700 hover:bg-blue-700 hover:text-white"}`}
          >
            <Download className="w-4 h-4" strokeWidth={3}/>
          </button> */}
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
        localUpdate={handleLocalUpdate}
        removeAgencyLocally={removeAgencyLocally}
        pagination={paginationInfo}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
      )}
      <SelectJobForBulkMatch
        dashboardType={"CORPORATE"}
        onClose= {() => setIsSelectJobForBulkMatch(false)}
        isOpen= {isSelectJobForBulkMatch}
        agencyData={selectedRows}
        userDetails={userDetails}
        setLoader={setLoader}
        loader={loader}
      />
    {isEmailForReferralOpen && 
      <AddEmailForReferralModal
        dashboardType={"CORPORATE"}
        onClose= {() => setIsEmailForReferralOpen(false)}
        isOpen= {isEmailForReferralOpen}
        // agencyData={selectedRows}
        userDetails={userDetails}
        setIsEmailAddedSuccessfully={setIsEmailAddedSuccessfully}
        setForwardingMailId={setForwardingMailId}
        setSubmittedMailId={setSubmittedMailId}
      />
    }
    {isEmailAddedSuccessfully && forwardingMailId && submittedMailId &&
      <EmailAddedModal
        dashboardType={"CORPORATE"}
        onClose= {() => {
          setIsEmailAddedSuccessfully(false)
          setForwardingMailId("")
          setSubmittedMailId("")
        }}
        isOpen= {isEmailAddedSuccessfully}
        forwardingMailId={forwardingMailId}
        submittedMailId={submittedMailId}
      />
    }
  {isCandidateBulkBanModelOpen && 
    <CandidateBulkBanModal
      comments={comments}
      setComments={setComments}
      reason={reason}
      setReason={setReason}
      onSubmit={()=>handleBulkBan()}
      onClose={()=>{
        setIsBulkBanSubmitting(false)
        setIsCandidateBulkBanModelOpen(false)
      }}
      isOpen={isCandidateBulkBanModelOpen}
      isBulkBanSubmitting={isBulkBanSubmitting}
    />}
    </div>
  )
}

export default CorporateDatabase