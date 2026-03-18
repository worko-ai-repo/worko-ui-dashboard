import SearchBar from '@Components/Shared/SearchBar'
import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AgencyCandidateListTable from './AgencyCandidateListTable'
import GenericDropdownAgency from '@Components/Shared/DropDown/GenericDropdownAgency'
import SearchBarAgency from '@Components/Shared/SearchBarAgency'
import { Check, LogOut, RefreshCcw, Send, X } from 'lucide-react'
import { AgencyAllCandidatesListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto'
import { useAppContext } from '@Context/App.context'
import httpServiceObj from '@Services/ApiHandler.service'
import { Company, CompanyAPIResponse, CompanyFormData } from './modals/AssignJobModal'
import AdminServiceObj from '../Services/Admin.service'
import { toast } from 'react-toastify'
import { getToastOptions } from 'lib-worko-ui'
import RejectCandidateModal from '@Components/Dashboard/Corporate/Agency/modals/RejectCandidateModal'
import { useUrlState } from '@Hooks/useUrlState.hook'
import { CommonPaginationPageSizeOptionsType } from '@TypesAndConstants/common.constants'
import Modal from '@Components/Shared/Modal'

export interface AgencyAllCandidatesListFilters {
  searchText?: string;
  companyId?: string;
  sortOrder?: "ascending" | "descending";
  userType?: string;
}

export interface AgencyAllCandidatesListApiResponse {
  data: AgencyAllCandidatesListDetailsDto[];
  pagination: PaginationInfo;
  totalReferrals?: number;
  currentPage?: number;
  totalPages?: number;
  matchingScore?: number;
}

export interface PaginationInfo {
  count: number;
  pageSize: number;
  sortOrder: string;
  timesQueried: number;
  queriedCount: number;
  lastKey: string;
  hasMore?:boolean;
}

const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 10,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};


const AgencyCandidateList = () => {
  // const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isRejecting,setIsRejecting] = useState<boolean>(false);
  const [fetchData, setFetchData] = useState<any[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [acceptingCandidate, setAcceptingCandidate] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState(false);
  const [dataFromParent, setDataFromParent] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null);
  const [isEvaluatorForm,setIsEvaluatorForm] = useState<boolean>(false);
  // const [pageSize,setPageSize] = useState<number>(10);
  const [filters, setFilters] = useState<AgencyAllCandidatesListFilters>({});
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const paginationKeysRef = useRef<Record<number, string>>({1: "",});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companySelectionMade, setCompanySelectionMade] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    designation: '',
    department: '',
    experienceInMonths: '',
    emailId: '',
  });
  const { searchText: searchBarText, setSearchText: setSearchBarText, pageSize, setPageSize } = useUrlState({
    search: {
      defaultValue: ""
    },
    pageSize: {
      defaultValue: 200,
      validValues: [10, 25, 50, 100, 150, 200]
    },
  });
  const [isJobsLoading,setIsJobsLoading] = useState<boolean>(false);
  const [jobFilter,setJobFilter] = useState<any>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [fetchJobsData, setFetchJobsData] = useState<any[]>([
      {
        label: "All",
        onClick: () => {
          setJobFilter("All");
          setSelectedJobId("");
          setCurrentPage(1);
          setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
        },
      },
    ]);

  const [isAgencyLoading,setIsAgencyLoading] = useState<boolean>(false);
  const [agencyFilter,setAgencyFilter] = useState<any>([]);
  const [selectedAgencyName, setSelectedAgencyName] = useState<string>("");
  const [fetchAgencyData, setFetchAgencyData] = useState<any[]>([
    {
      label: "All",
      onClick: () => {
        setAgencyFilter("All");
        setSelectedAgencyName("");
        setCurrentPage(1);
        setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
      },
    },
  ]);

  const [initialIds,setInitialIds] = useState<any[]>([])
  const { userDetails } = useAppContext();
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE

  const fetchAllCandidatesData = useCallback(
      async (
        page: number = 1,
        size: number = pageSize,
        lastKey: string = "",
        searchFilters = filters,
        isSearch = false,
        sortOrder = "desc",
        jobId: string = "",    
        agencyName: string = "",
        searchBarText:string = ""
      ) => {
  
        if (!userDetails?.email) return;
    
        setIsLoading(true);
        try {
        const url = `${agencyBaseUrl}/agency-user-submission/`;
        const params: Record<string, any>  = {
          // agencyJobAssignedByCorporateUserId:userDetails?.id,
          includeJobDetails: true,
          includeCandidateParsedCvDetails: true,
          // searchText: string,
          pageSize:size,
          lastKey,
          sortOrder,
        }
        if (selectedCompany?.id) params.companyId = selectedCompany.id;
        if (jobId) params.jobId = jobId;
        if (agencyName) params.agencyName = agencyName;
        if (searchBarText?.trim()) params.searchText = searchBarText
          const { response } = await httpServiceObj.get<AgencyAllCandidatesListApiResponse>(url, true, params, true);
    
          if (response) {
          setFetchData(response.data);
          const fetchingScoreid = response.data
            .filter(d => d.isFindMatchingScoreInProgress === true)
            .map(d => d.id);

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
            console.error("Cannot fetch user details");
          }
        } catch (err) {
          console.error("Exception in fetchReferrals:", err);
        } finally {
          setIsLoading(false);
        }
      },
      [userDetails?.email, pageSize, filters]
    );


  // FETCHING THE COMPANY
  useEffect(() => {
    // if user changes the typed name after selecting, clear the selection
    if (companySelectionMade && selectedCompany && formData.companyName !== selectedCompany.name) {
      setCompanySelectionMade(false);
      setSelectedCompany(null);
      setFetchJobsData([]);
    }
  }, [formData.companyName, companySelectionMade, selectedCompany]);

  // search companies to assign jobs
  useEffect(() => {
    if (!formData.companyName.trim() || companySelectionMade) {
      setSuggestions([]);
      return;
    }
    // instantly show loading
    setIsLoadingCompany(true);

    const delay = setTimeout(() => {
      fetchCompanies(formData.companyName);
    }, 250);

    return () => clearTimeout(delay);
  }, [formData.companyName, companySelectionMade]);

  const handleCompanyChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'companyName') {
      setCompanySelectionMade(false);      
      setShowSuggestions(true);
    }
    //if the value is set zero then fetch the api again to show full list
    if (value.trim() === '') {
      setSelectedCompany(null);
      setFetchJobsData(prev => [prev[0]]);
      setSelectedJobId("");
      setCurrentPage(1);
      setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchAllCandidatesData( 1, pageSize, "", filters, false, "desc", "", selectedAgencyName, searchBarText || ""
      );
    }
  };

  const handleSuggestionClick = (company: Company) => {
    setFormData((prev) => ({ ...prev, companyName: company.name }));
    setCompanySelectionMade(true);
    setSelectedCompany(company);
    setShowSuggestions(false);
    setSuggestions([]);
  }; 
    
  const fetchCompanies = async (query:string) => {
    setIsLoadingCompany(true)
    try {
      const {response} = await httpServiceObj.get(`/company?companyName=${query}`,true,{});
      const typedResponse = response as CompanyAPIResponse;
      setSuggestions(typedResponse.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoadingCompany(false)
    }
  };

  // FETCHING THE JOBS
  const fetchAllJobs = useCallback(async () => {
      if (!userDetails?.email){
        toast.error("Email id not found",getToastOptions({}))
        return
      };

      setIsJobsLoading(true);
      try {
      const params = {
        pageSize: 200,
        sortOrder: "desc",
        dashboard: "ADMIN",
        status: "PUBLISHED",
        includeCompanyDetails: true,
        includeCountCompanyJobEntityJobApplication:true,
        companyId: selectedCompany?.id ?? "",
      }
        const response  = await AdminServiceObj.fetchJobs(params);
        if (response && Array.isArray(response.data)) {
          const jobOptions = response.data.map((job: any) => {
          const title = job.jobTitle ?? job.title ?? job.name ?? `Job-${job.id ?? ""}`;
          const minSalary = job.salaryRange?.min ?? job.jobTitle?.salaryRange?.min ?? job.minSalary ?? "N/A";
          const maxSalary = job.salaryRange?.max ?? job.jobTitle?.salaryRange?.max ?? job.maxSalary ?? "N/A";
          const location = job.location?.fullLocation ?? job.jobTitle?.location?.fullLocation ?? job.location?.fullLocation ?? "N/A";
          // const label = `${title} | ${minSalary}LPA - ${maxSalary}LPA | ${location}`;
          const label = `${title}`;
          const id = job.id;
        return {
          label,
          onClick: () => {
            setJobFilter(label);
            setSelectedJobId(id ?? "");
            setCurrentPage(1);
            setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
            paginationKeysRef.current = { 1: "" };
          },

          raw: job,
        };
    });

    setFetchJobsData(prev => [prev[0], ...jobOptions]);
        } else {
          console.error("Cannot fetch user details");
        }
      } catch (err) {
        console.error("Exception in Agency all candidates list", err);
      } finally {
        setIsJobsLoading(false);
      }
    },
    [selectedCompany?.id]
  );

  const fetchAllAgency = useCallback(async () => {
      if (!userDetails?.email){
        toast.error("Email id not found",getToastOptions({}))
        return
      };

      setIsAgencyLoading(true);
      try {
        const uniqueAgencyNames:any = ["ASDAAAS","NELLSYS","CHIPLUN"];
          const agencyList = uniqueAgencyNames.map((agency: any) => {
          const title = agency.toUpperCase();
          const label = `${title}` 
      return {
        label,
        onClick: () => {
          setAgencyFilter(label);
          setSelectedAgencyName(agency ?? "");
          setCurrentPage(1);
          setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
          paginationKeysRef.current = { 1: "" };
        },

        raw: agency,
      };
    });

    setFetchAgencyData(prev => [prev[0], ...agencyList]);
      } catch (err) {
        console.error("Exception in Agency all candidates list", err);
      } finally {
        setIsAgencyLoading(false);
      }
    },
    [userDetails, filters]
  );

  useEffect(() => {
      if (userDetails?.email) {
        setCurrentPage(1);
        setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
        paginationKeysRef.current = { 1: "" };
        fetchAllCandidatesData(1, pageSize, "", filters, false, "desc", selectedJobId, selectedAgencyName,searchBarText || "");
        // fetchAllAgency()
      }
    }, [userDetails?.email, pageSize, selectedJobId, selectedAgencyName, filters]);
  // }, [userDetails, fetchAllCandidatesData, pageSize, selectedJobId, selectedAgencyName, fetchAllAgency, filters, searchBarText]);

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchAllJobs();
  }, [selectedCompany?.id, fetchAllJobs]);

  
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
      if (!userDetails?.email) return;
  
      if (searchInputRef.current) {
        clearTimeout(searchInputRef.current);
      }
  
      searchInputRef.current = setTimeout(() => {
        setCurrentPage(1);
        setPaginationInfo(prev => ({ ...prev, lastKey: "" }));
        paginationKeysRef.current = { 1: "" };
  
        fetchAllCandidatesData(
          1,
          pageSize,
          "",
          filters,
          true,
          "desc",
          selectedJobId,
          selectedAgencyName,
          searchBarText || ""
        );
      }, 500);
  
      return () => {
        if (searchInputRef.current) {
          clearTimeout(searchInputRef.current);
        }
      };
  }, [searchBarText]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
  };

  const handlePageChange = useCallback((page: number) => {
      const lastKey = paginationKeysRef.current[page] || "";
      
      setCurrentPage(page);
      fetchAllCandidatesData(page, pageSize, lastKey);
    },
    [fetchAllCandidatesData, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: CommonPaginationPageSizeOptionsType) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      // fetchAllCandidatesData(1, size, "");
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

  const bulkRejectCandidates = async () =>{
    const removeAlreadyRejected = selectedRows.filter(candidate=>{
      return !candidate.jobApplicationStatus
    })
    const names = selectedRows.map(candidate=>{
      return candidate?.candidateParsedCvDetails?.name
    })
    const joinedNames = names.join(", ")
    if(removeAlreadyRejected.length === 0) {
      toast.error("All selected candidates are already rejected or moved to applicant",getToastOptions({}))
      setSelectedRows([])
      return
    }
    setSelectedRows(removeAlreadyRejected)
    setIsRejecting(true)
  }

  const findMatchingScoreBulk = async () => {
    const candidatesToSend = selectedRows.filter(row => row?.matchingScoreDetails?.matchingScore == null && !row?.jobApplicationStatus && !row?.isFindMatchingScoreInProgress)

    if(candidatesToSend.length === 0){
      toast.error("Selected candidates scores are already generated or moved to applicants, or score generation is in progress.",getToastOptions({}))
      return
    }
    setScoreLoading(true);
    
    const onlyIds = candidatesToSend
      .filter(details => {
        if (!details?.candidateParsedCvDetails?.agencyUserSubmissionId) {
          toast.error(
            `No id found for ${details?.candidateParsedCvDetails?.name ?? details?.candidateEmail}`,
            getToastOptions({})
          );
          return false;
        }
        return true;
      }).map(details => details.candidateParsedCvDetails.agencyUserSubmissionId);

      if(onlyIds.length === 0){
        toast.error("No ID was found for any candidate.",getToastOptions({}))
        setSelectedRows([])
        return
      }

    const filteredCandidates = candidatesToSend.filter(details =>{
      return details?.candidateParsedCvDetails?.agencyUserSubmissionId
    })
    setSelectedRows(filteredCandidates)
    const payload = { agencyUserSubmissionIds: onlyIds };

    try {
    const { response, error } = await httpServiceObj.post(
      `${agencyBaseUrl}/agency-user-submission/find-matching-score/bulk`,
      payload,
      true,
      {},
      true
    );

    if (error) {
      toast.error(error.message, getToastOptions({}));
      return;
    }

    if (response) {
      filteredCandidates.forEach(row => {
        handleLocalUpdate(row.id, { ...row, isFindMatchingScoreInProgress: true });
      });
      setSelectedRows([])
      toast.success("Finding score initiated", getToastOptions({}));
      setInitialIds(prev => [...prev, ...onlyIds]);
    }
    } catch (err) {
      console.error("Bulk score error:", err);
    } finally {
      setScoreLoading(false)
    }
  };

  // const handleLocalUpdateScore = useCallback((jobId: string, updatedData: any) => {
  //   setFetchData((prevData) =>
  //       prevData.map((candidate) =>
  //         selectedRows.some((sel) => sel.id === candidate.id)
  //           ? { ...candidate, score: 80 }
  //           : candidate
  //       )
  //     );
  // }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap lg:items-center gap-2 w-full">
        <div className="w-full md:basis-full">
          <SearchBarAgency
            searchBarText={searchBarText}
            setSearchBarText={setSearchBarText as React.Dispatch<React.SetStateAction<string | null>>}
            handleClick={() => {}}
            placeholder="Search candidates by name or email"
          />
        </div>
        
        <div className="flex gap-2 font-semibold w-full sm:w-auto md:flex-1 lg:flex-none">
          <div className="relative overflow-visible w-full min-w-0">
            <input
              type="text"
              placeholder="Enter company name"
              className="border px-3 py-2 rounded-md w-full text-xs h-9 bg-white shadow-md"
              value={formData.companyName}
              onChange={(e) => handleCompanyChange('companyName', e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // allow click
              autoComplete="off"
            />

            {formData.companyName?.trim() && !companySelectionMade && showSuggestions && (
              <ul
                className="border bg-white rounded shadow-md absolute w-full z-[40] max-h-60 overflow-y-auto"
                aria-live="polite"
              >
                {/* show only while loading */}
                {isLoadingCompany && (
                  <li className="block w-full px-4 py-2 text-gray-500 text-left">
                    Loading companies...
                  </li>
                )}

                {/* when not loading, show results or empty message */}
                {!isLoadingCompany && (
                  <>
                    {suggestions.length > 0 ? (
                      suggestions.map((company, idx) => (
                        <li
                          key={company.id ?? idx}
                          className="block w-full px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                          onMouseDown={() => handleSuggestionClick(company)}
                        >
                          {company.name}
                        </li>
                      ))
                    ) : (
                      <li className="block w-full px-4 py-2 text-gray-500 cursor-default text-left">
                        Sorry no company found
                      </li>
                    )}
                  </>
                )}
              </ul>
            )}
          </div>
        </div>
                  
        <div className="flex flex-col sm:flex-row gap-2 w-full md:flex-1 lg:w-auto items-stretch sm:items-center">
          {/* Dropdown 1 */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:mt-0">
              <div className="flex w-full sm:w-auto font-semibold">
                <GenericDropdownAgency
                  selectTitle={"Select job"}
                  tooltipMessage="Select Status to filter applications"
                  disabled={!companySelectionMade}
                  options={fetchJobsData}
                  isJobsLoading={isJobsLoading}
                />
              </div>
            </div>

          {/* Dropdown 2 */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:mt-0">
              <div className="flex w-full sm:w-auto font-semibold">
                <GenericDropdownAgency
                  selectTitle={"Select agency"}
                  tooltipMessage="Select Status to filter applications"
                  // disabled={!companySelectionMade}
                  disabled={true}
                  options={fetchAgencyData}
                  isJobsLoading={isAgencyLoading}
                />
              </div>
            </div>
            {/* BULK REJECT AND BULK FIND MATCHING SCORE IS IMPLEMENTED AND WORKING JUST UNCOMMENT IT*/}
            {/* <div className="w-full md:w-auto lg:w-auto">
              <div className="flex flex-row gap-2 justify-center items-center overflow-x-auto lg:overflow-visible">   
                <button
                  type="button"
                  onClick={bulkRejectCandidates}
                  disabled={selectedRows.length === 0}
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={"Reject"}
                  className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md border bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  type="button"
                  disabled={selectedRows.length === 0}
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={"Find matching score"}
                  onClick={findMatchingScoreBulk}
                  className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-gradient-to-br from-cyan-300 to-cyan-500 text-white hover:to-cyan-700"
                >
                  <RefreshCcw className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div> */}
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
              <AgencyCandidateListTable
                data={fetchData}
                userType="ADMIN"
                refetch={refetch}
                ListSelection={ListSelection}
                handleUpdate={handleJobApplicationStatusUpdate}
                sendApplicationToRecruiter={handleSendToRecruiter}
                isBulkEvaluation={!!selectedRows.length}
                onBulkUpdate={onBulkUpdate}
                scoreLoading={scoreLoading}
                initialIds={initialIds}
                setInitialIds={setInitialIds}
                localUpdate={handleLocalUpdate}
                setFetchData={setFetchData}
                setSelectedRows={setSelectedRows}
                pagination={paginationInfo}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
      )}
      {/* <Modal
      isOpen={isRejecting}
      onClose={()=>setIsRejecting(false)}
      className="max-w-md sm:w-[400px]"
      classNameHeight="h-[80vh]">
        {isRejecting &&      
          <RejectCandidateModal
            onClose={()=>setIsRejecting(false)}
            isOpen={isRejecting}
            data={selectedRows}
            type={"bulk"}
            setFetchData={setFetchData}
            setSelectedRows={setSelectedRows}
            localUpdate={handleLocalUpdate}
        />}
      </Modal> */}
    </div>
  )
}

export default AgencyCandidateList
