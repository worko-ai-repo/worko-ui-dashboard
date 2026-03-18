import DatabaseDropdown from '@Components/Shared/DropDown/DatabaseDropdown';
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType, JobApplicationStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { Ban, Download, Forward, Pencil, Trash2, Upload,Eye, User } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CorporateDatabaseTable from './CorporateDatabaseTable';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import SearchBarAgency from '@Components/Shared/SearchBarAgency';
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import { useDashboardContext } from '@Context/Dashboard.context'
import httpServiceObj from '@Services/ApiHandler.service';
import { PaginationInfo } from '@Components/Dashboard/Candidate/Pages/Job/JobTypes';
import { AgencyDatabaseApplicantDetailsDto, AgencyListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import SelectJobForBulkMatch from './modals/SelectJobForBulkMatchModal';
import CandidateBulkBanModal from './modals/CandidateBulkBanModal';
import { HiringEligibilityStatus, RefereeTypeStatus } from '@TypesAndConstants/JobsAndApplication.type';
import EditCTCETCAndNoticePeriodModal from './modals/EditCTCETCAndNoticePeriodModal';
import MoveToApplicantsBulk from './modals/MoveToApplicantsBulk';
import FinalReviewModal from './modals/FinalReviewModal';
import { filterDatabaseCandidates } from '@Utils/DatabaseFilter.utils';
import DatabaseFilters, { DatabaseFilterValues } from '@Components/Shared/DatabasePage/DatabaseFilters';
import { useUrlState } from '@Hooks/useUrlState.hook';
import { CommonPaginationPageSizeOptionsType } from '@TypesAndConstants/common.constants';
import Modal from '@Components/Shared/Modal';

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
  companyName?: string;
}

export interface DatabaseListApiResponse {
  data: AgencyDatabaseApplicantDetailsDto[];
  pagination: PaginationInfo;
  totalReferrals?: number;
  currentPage?: number;
  totalPages?: number;
  matchingScore?: number;
}
export type SendResumeCountApiResponse = {
  createdAt : string;
  createdByCorporateUserId: string;
  id: string;
  processingStatus: string;
  totalResumesDuplicate: number;
  totalResumesFailed : number;
  totalResumesProcessed : number;
  totalResumesSucceeded : number;
  totalResumesUploaded : number;
  totalLargeResumesUploaded : number;
  totalInvalidFileNamesUploaded : number;
  updatedAt : string;
}
interface ResponseApi {
  isSuccess:boolean;
}
const CorporateDatabase:React.FC<CorporateDatabaseProps> = () => {
    // const [searchBarText, setSearchBarText] = useState<string|null>("")
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
    // const [pageSize,setPageSize] = useState<number>(200);
    const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
    const [apiFilters, setApiFilters] = useState<DatabaseListFilters>({});
    const paginationKeysRef = useRef<Record<number, string>>({1: "",});
    const [currentPage, setCurrentPage] = useState(1);
    // const [isSelectJobForBulkMatch,setIsSelectJobForBulkMatch] = useState<boolean>(false);
    const [loader, setLoader] = useState(false);

    const [reason,setReason] = useState<string>("");
    const [comments,setComments] = useState<string>("");
    const [isCandidateBulkBanModelOpen,setIsCandidateBulkBanModelOpen] = useState<boolean>(false);
    const [isBulkBanSubmitting,setIsBulkBanSubmitting] = useState<boolean>(false);
    const [isAssignJobModelOpen, setIsAssignJobModelOpen] = useState<boolean>(false);
    const [editProfileView, setEditProfileView] = useState<boolean>(false);
    const [editProfileData, setEditProfileData] = useState<AgencyDatabaseApplicantDetailsDto | undefined>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [candidateList, setCandidateList] = useState<any[]>([]);
    const [selectedCompany,setSelectedCompany]  = useState<any | null>(null);
    const [skippableCandidates, setSkippableCandidates] = useState<any[]>([]);
    const [repeatedCandidatesList, setRepeatedCandidatesList] = useState<string>("");
    const [isFinalReviewModalOpen,setIsFinalReviewModalOpen]  = useState<boolean>(false);
    const [successfullySentCandidateList,setSuccessfullySentCandidateList]  = useState<string>("");
    const [incompleteSentCandidateList,setIncompleteSentCandidateList]  = useState<string>("");
    const [initialIds,setInitialIds] = useState<string[]>([])
    const [filters, setFilters] = useState<DatabaseFilterValues>({});
    const { searchText: searchBarText, setSearchText: setSearchBarText, pageSize, setPageSize } = useUrlState({
    search: {
      defaultValue: ""
    },
      pageSize: {
        defaultValue: 200,
        validValues: [10, 25, 50, 100, 150, 200]
      }
    });
    const filteredData = useMemo(() => {
      if (!fetchData) return fetchData;
      return filterDatabaseCandidates(fetchData, filters);
    }, [fetchData, filters]);
    useEffect(() => {
      function handleClickOutside(event:any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
      searchFilters = apiFilters,
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

        // include apiFilters if present
        const searchValue = searchBarText?.trim() ?? "";
        if (searchValue) {
          params.searchText = searchValue;
        }
        if (searchFilters?.userType) params.userType = searchFilters.userType;

        // include status hiringEligibilityStatus if provided
        if (hiringEligibiltyStatus !== undefined) params.hiringEligibilityStatus  = hiringEligibiltyStatus

        // include status refereeTypeStatus if provided)
        if (refereeTypeStatus !== undefined) params.refereeType  = refereeTypeStatus

        const { response } = await httpServiceObj.get<DatabaseListApiResponse>(url, true, params, true);

        if (response) {
          setFetchData(response.data);
          const fetchingScoreid = response.data
            .filter(d => d?.candidateParsedCvDetails?.isCandidateCvRefreshInProgress === true)
            .map(d => d.candidateParsedCvId);

          setInitialIds(fetchingScoreid);
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
          // toast.error("Cannot fetch user details",getToastOptions({}))
          console.error("Cannot fetch user details");
        }
      } catch (err) {
        console.error("Exception in fetchDatabaseData:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [userDetails, pageSize, apiFilters, hiringEligibiltyStatus, refereeTypeStatus,searchBarText]
  );

    useEffect(() => {
        if (userDetails?.email) {
          setCurrentPage(1);
          setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
          paginationKeysRef.current = { 1: "" };
          fetchDatabaseData(1, pageSize, "");
        }
      }, [userDetails?.email, pageSize, hiringEligibiltyStatus, refereeTypeStatus]);
    // }, [userDetails, fetchDatabaseData, pageSize]);
    
    const searchInputRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
      if (!userDetails?.email) return;

      if (searchInputRef.current) {
        clearTimeout(searchInputRef.current);
      }

      searchInputRef.current = setTimeout(() => {
        setCurrentPage(1);
        setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
        paginationKeysRef.current = { 1: "" };

        fetchDatabaseData(1, pageSize, "", apiFilters, true);
      }, 500); // 500ms debounce

      return () => {
        if (searchInputRef.current) {
          clearTimeout(searchInputRef.current);
        }
      };
    }, [searchBarText]);

    // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   setSearchBarText(e.target.value);
    // };
      
    const handlePageChange = useCallback((page: number) => {
        const lastKey = paginationKeysRef.current[page] || "";
        
        setCurrentPage(page);
        fetchDatabaseData(page, pageSize, lastKey);
      },
      [fetchDatabaseData, pageSize]
    );
      
    const handlePageSizeChange = useCallback(
      (size: CommonPaginationPageSizeOptionsType) => {
        setPageSize(size);
        setCurrentPage(1);
        setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
        paginationKeysRef.current = { 1: "" };
        // fetchDatabaseData(1, size, "");
      },
      [setPageSize]
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

    const handleLocalUpdateForQuery = useCallback((jobId: string, updatedData: any) => {
      setFetchData((prevData: any) => {
        if (!prevData || !Array.isArray(prevData)) return prevData;
  
        return prevData.map(job =>
          job.candidateParsedCvId === jobId
            ? {
                ...job,
                candidateParsedCvDetails: {
                  ...job.candidateParsedCvDetails,
                  ...updatedData
                }
              }
            : job
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
    const totalfiles = event.target.files;
    if (!totalfiles || totalfiles.length === 0) return;

    if (totalfiles.length > 500) {
      toast.error("You can upload a maximum of 500 CVs at a time.", getToastOptions({}));
      return;
    }

    const invalidPDFFilesNames = Array.from(totalfiles).filter(
      (file) => file.type !== "application/pdf"
    ).map(file =>{
      return{
        fileName:file.name,
        fileType:file.type,
        fileSize:file.size,
      }
    })

    const validPDFFilesNames = Array.from(totalfiles).filter(
      (file) => file.type === "application/pdf"
    ).map(file =>{
      return{
        fileName:file.name,
        fileType:file.type,
        fileSize:file.size,
      }
    })

    const overSizedPDFFilesNames = Array.from(validPDFFilesNames).filter(
      (file) => file.fileSize > 3 * 1024 * 1024
    ).map(file =>{
      return{
        fileName:file.fileName,
        fileType:file.fileType,
      }
    })

    const files = Array.from(totalfiles).filter(
      file => file.size <= 3 * 1024 * 1024 && file.type === "application/pdf"
    );
    // const pdfFiles = Array.from(files).filter(
    //   (file) => file.type === "application/pdf"
    // );

    // if (pdfFiles.length !== files.length) {
    //   toast.error("Only PDF files are allowed.",getToastOptions({}));
    //   return;
    // }

    // const oversizedFiles = pdfFiles.filter((file) => file.size > 2 * 1024 * 1024);
    // if (oversizedFiles.length > 0) {
    //   toast.error(`Max limit for each CV is 2MB`,getToastOptions({}));
    //   return;
    // }
    if(!files.length){
      toast.error("All the selected files are either Invalid or Oversized",getToastOptions({}))
      return
    }
    const countsPayload: Partial<SendResumeCountApiResponse> = {
      totalResumesUploaded:files.length
    }
    if(invalidPDFFilesNames.length) countsPayload.totalInvalidFileNamesUploaded=invalidPDFFilesNames.length
    if(overSizedPDFFilesNames.length) countsPayload.totalLargeResumesUploaded=overSizedPDFFilesNames.length
    
    const resumeCountResponse = await sendResumeCount(countsPayload)
    if (!resumeCountResponse.success) {
      toast.error((resumeCountResponse?.error as { message?: string })?.message, getToastOptions({}));
      return; 
    }
    const resumeCountResponseId = resumeCountResponse?.data?.id

    const chunkSize = 50;
    for (let i = 0; i < files.length; i += chunkSize) {
    const currentChunk = files.slice(i, i + chunkSize);

    let pdfFilesNameAndType  = currentChunk.map(file =>{
      return {
        fileMimeType:file.type,
        fileName:file.name
      }
    })
    if(invalidPDFFilesNames.length){
      pdfFilesNameAndType = [
        ...pdfFilesNameAndType,
        ...invalidPDFFilesNames.map(file => ({
          bulkSourceTypeParseResumeStatus: "INVALID_FILE_NAME",
          fileMimeType: file.fileType,
          fileName: file.fileName
        }))
      ]
    }
    if(overSizedPDFFilesNames.length){
      pdfFilesNameAndType = [
        ...pdfFilesNameAndType,
        ...overSizedPDFFilesNames.map(file => ({
          bulkSourceTypeParseResumeStatus: "LARGE_RESUME_FILE",
          fileMimeType: file.fileType,
          fileName: file.fileName
        }))
      ]
    }
    const payload = {
      companyId: userDetails?.companyId,
      bulkCvs:pdfFilesNameAndType,
      bulkSourceTypeResumeId:resumeCountResponseId
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

  const sendResumeCount = async (payload: any) => {
    try {
      const { response } = await httpServiceObj.post<SendResumeCountApiResponse>(`${agencyBaseUrl}/bulk-source-type-resume/`, payload, true, {}, true);
      if (response) {
        return { success: true, data: response };
      }
      return { success: false };
    } catch (error) {
      console.error("Error in sending files count", error);
      return { success: false, error };
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

  // const createAgencyProfile = async (payload: any) => {
  //   try {
  //     const { response } = await httpServiceObj.patch(`${agencyBaseUrl}/agency-invite/`, payload, true, {}, true);
  //     if (response) {
  //       return { success: true, data: response };
  //     }
  //     return { success: false };
  //   } catch (error) {
  //     console.error("Agency creation failed:", error);
  //     return { success: false, error };
  //   }
  // };

  const handleBulkMoveToApplicants = async (job:any) =>{
    if(!job){
      toast.error("No job found please select a job",getToastOptions({}))
      return
    }

    const candidateEmails = selectedRows.map(row =>{
      return row?.candidateEmail
    })

    try {
      const payload = {
        jobId: job?.id,
        applicantEmails: candidateEmails
      }
      const {response, error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/candidate-parsed-cv/duplicate-job-appl/bulk`,payload,true,{},true)
      if(error){
        toast.error(error.message,getToastOptions({}))
        return
      }
      let finalCandidates = [...selectedRows]
      if(response.data.length > 0 && response.count > 0){
        const repeatedEmails = response.data.map((item: any) => {
          const parts = item.PK.split("USR#EML#");
          return parts[1];
        });
        
        finalCandidates = selectedRows.filter(candidate =>
          !repeatedEmails.includes(candidate.candidateEmail)
        );
        setSelectedRows(finalCandidates)
        if(finalCandidates.length === 0){
          toast.error(`All selected candidates are already moved to applicant`,getToastOptions({}));
          return;
        }
        const namesOfRepeatedEmail = selectedRows
        .filter(candidate => repeatedEmails.includes(candidate.candidateEmail))
        .map(c => c.candidateParsedCvDetails.name);

        const repeatedNamesString = namesOfRepeatedEmail.join(", ");
        setRepeatedCandidatesList(repeatedNamesString)     
      }
      setSelectedCompany(job)
      handleUpdateDetails(finalCandidates)
    } catch (error) {
      console.log(error)
    } finally {
      setIsAssignJobModelOpen(false)
    }
  }

  const days90 = 90 * 24 * 60 * 60 * 1000;

  const isSkippable = (row:any) => {
    if (!row?.candidateParsedCvDetails) return false;

    const details = row.candidateParsedCvDetails;

    const { currentCTC, expectedCTC, noticePeriod, updatedAt } = details;

    // All 3 fields must be undefined or null
    const allNonZero =
      (currentCTC !== undefined && currentCTC !== null) &&
      (expectedCTC !== undefined && expectedCTC !== null) &&
      (noticePeriod !== undefined && noticePeriod !== null);


    // updatedAt must be within last 90 days
    const updatedDate:any = new Date(updatedAt);
    const today:any = new Date();
    const isRecent = today - updatedDate <= days90;
    return allNonZero && isRecent;
  };

  const handleUpdateDetails = (selectedRows:any) => {
    if (selectedRows.length === 0) return;

    const unskippableList = selectedRows.filter((row:any) => !isSkippable(row));
    const skippableList = selectedRows.filter((row:any) => isSkippable(row));
    setSkippableCandidates(skippableList);

    // if (unskippableList.length === 0) return;

    setCandidateList(unskippableList);
    setCurrentIndex(0);
    setEditProfileView(true);
  };



  // const handleCloseModal = () => {
  //   let nextIndex = currentIndex + 1;

  //   // Skip skippable rows
  //   while (nextIndex < candidateList.length && isSkippable(candidateList[nextIndex])) {
  //       nextIndex++;
  //   }

  //   if (nextIndex < candidateList.length) {
  //       setCurrentIndex(nextIndex);
  //   } else {
  //       setEditProfileView(false);
  //   }
  // };



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
          setSearchBarText={setSearchBarText as React.Dispatch<React.SetStateAction<string | null>>}
          handleClick={() => {}}
          placeholder="Search candidates by name or email"
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
          <DatabaseFilters onFilterChange={setFilters} className="min-w-fit" />
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
        {/* {isCorporateAdmin &&         
          <button
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Add email for referral"}
            className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-white text-blue-700 hover:bg-blue-700 hover:text-white"
          >
            <User className="w-4 h-4" strokeWidth={4}/>
          </button>} */}

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
              onClick={()=>{
                if(selectedRows.length > 10){
                  toast.error("Maximum 10 applicants are at allowed for this action",getToastOptions({}))
                  return
                }
                setIsAssignJobModelOpen(true)
              }}
              disabled={selectedRows.length < 1}
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
        data={filteredData}
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
        initialIds={initialIds}
        setInitialIds={setInitialIds}
        handleLocalUpdateForQuery={handleLocalUpdateForQuery}
      />
      )}
      {/* <SelectJobForBulkMatch
        dashboardType={"CORPORATE"}
        onClose= {() => setIsSelectJobForBulkMatch(false)}
        isOpen= {isSelectJobForBulkMatch}
        agencyData={selectedRows}
        userDetails={userDetails}
        setLoader={setLoader}
        loader={loader}
      /> */}
    <Modal
      isOpen={isCandidateBulkBanModelOpen}
      onClose={()=>{
        setIsCandidateBulkBanModelOpen(false)
        setIsBulkBanSubmitting(false)
        setReason("")
        setComments("")
      }}
      className="max-w-md sm:w-[400px] "
      classNameHeight="h-[65vh]">
      {isCandidateBulkBanModelOpen && (
        <CandidateBulkBanModal
          comments={comments}
          setComments={setComments}
          reason={reason}
          setReason={setReason}
          onSubmit={()=>handleBulkBan()}
          onClose={()=>{
            setIsBulkBanSubmitting(false)
            setIsCandidateBulkBanModelOpen(false)
            setReason("")
            setComments("")
          }}
          isOpen={isCandidateBulkBanModelOpen}
          isBulkBanSubmitting={isBulkBanSubmitting}
        />)
        } 
    </Modal>
    <Modal
      isOpen={isAssignJobModelOpen}
      onClose={() => setIsAssignJobModelOpen(false)}
      className="max-w-md sm:w-[400px] "
      classNameHeight="h-[100vh]">
      {isAssignJobModelOpen && (
        <MoveToApplicantsBulk
          dashboardType={"CORPORATE"}
          pageType={"DATABASE"}
          textToDisplay={"Move to applicant :"}
          onClose={() => {
            setIsAssignJobModelOpen(false);
          }}
          isOpen={isAssignJobModelOpen}
          candidateData={selectedRows[0]}
          userDetails={userDetails}
          submitFunction={handleBulkMoveToApplicants}
        />)
      }
    </Modal>
  {/* {editProfileView && */}
    <EditCTCETCAndNoticePeriodModal
    dashboardType={"CORPORATE"}
    dashboardPage={"MYDATABASE"}
    onClose={()=>{
      setEditProfileView(false)
      setCandidateList([])
      setSkippableCandidates([])
      setCurrentIndex(0)
      setSelectedCompany(null)
    }}
    isOpen={editProfileView}    
    setCandidateList={setCandidateList}
    candidateList={candidateList}
    skippableCandidates={skippableCandidates}
    currentIndex={currentIndex}
    setCurrentIndex={setCurrentIndex}
    selectedCompany={selectedCompany}
    localUpdate={handleLocalUpdate}
    setIsFinalReviewModalOpen={setIsFinalReviewModalOpen}
    setSuccessfullySentCandidateList={setSuccessfullySentCandidateList}
    setIncompleteSentCandidateList={setIncompleteSentCandidateList}
    />
    {/* } */}
    <Modal
      isOpen={isFinalReviewModalOpen}
      onClose={() => {
        setIsFinalReviewModalOpen(false)
        setSuccessfullySentCandidateList("")
        setIncompleteSentCandidateList("")
        setRepeatedCandidatesList("")
      }}
      className="max-w-md sm:w-[400px] "
      classNameHeight="h-[50vh]">
    {isFinalReviewModalOpen && (
    <FinalReviewModal
        isOpen={isFinalReviewModalOpen}
        onClose={() => {
            setIsFinalReviewModalOpen(false)
            setSuccessfullySentCandidateList("")
            setIncompleteSentCandidateList("")
            setRepeatedCandidatesList("")
        }}
        successfullySentCandidateList={successfullySentCandidateList}
        incompleteSentCandidateList={incompleteSentCandidateList}
        repeatedCandidatesList={repeatedCandidatesList}
    />
    )}
    </Modal>
    </div>
  )
}

export default CorporateDatabase