import SearchBar from '@Components/Shared/SearchBar'
import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AgencyCandidateListTable from './AgencyCandidateListTable'
import GenericDropdownAgency, { DropDownOption } from '@Components/Shared/DropDown/GenericDropdownAgency'
import SearchBarAgency from '@Components/Shared/SearchBarAgency'
import httpServiceObj from '@Services/ApiHandler.service'
import { AgencyAllCandidatesListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto'
import { Check, RefreshCcw, Send, X } from 'lucide-react'
import RejectCandidateModal from './modals/RejectCandidateModal'
import { toast } from 'react-toastify'
import { getToastOptions } from 'lib-worko-ui'
import { useQuery } from '@tanstack/react-query';
import EvaluatorForm from '@Components/Shared/ApplicantsPage/EvaluatorForm'
import Modal from '@Components/Shared/Modal'
import { useAppContext } from '@Context/App.context'
import CorporateServiceObj from '../Services/Corporate.service'

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
  const [searchBarText,setSearchBarText] = useState<string|null>("")
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
  const [pageSize,setPageSize] = useState<number>(10);
  const [filters, setFilters] = useState<AgencyAllCandidatesListFilters>({});
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const paginationKeysRef = useRef<Record<number, string>>({1: "",});

  const [isJobsLoading,setIsJobsLoading] = useState<boolean>(false);
  const [jobFilter,setJobFilter] = useState<any>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [fetchJobsData, setFetchJobsData] = useState<any[]>([]);

  const [isAgencyLoading,setIsAgencyLoading] = useState<boolean>(false);
  const [agencyFilter,setAgencyFilter] = useState<any>([]);
  const [selectedAgencyName, setSelectedAgencyName] = useState<string>("");
  const [fetchAgencyData, setFetchAgencyData] = useState<any[]>([]);
  const [initialIds,setInitialIds] = useState<any[]>([])
  const { userDetails } = useAppContext();
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE

  //to debounce just uncomment the below
  //   useEffect(() => {
  //   const timer = setTimeout(() => {
  //   fetchAllCandidatesData(1, pageSize, "", filters, false, "desc", selectedJobId, selectedAgencyName,searchBarText??"");
  //   }, 1000);

  //   return () => clearTimeout(timer);  
  // }, [searchBarText]);

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
      let params:any = {
        companyId:userDetails?.companyId,
        agencyJobAssignedByCorporateUserId:userDetails?.id,
        includeJobDetails: true,
        includeCandidateParsedCvDetails: true,
        pageSize:size,
        lastKey,
        sortOrder,
      }
      if (jobId) params.jobId = jobId;
      if (agencyName) params.agencyName = agencyName;
      if (searchBarText?.trim()) params.candidateEmail = searchBarText

        const { response } = await httpServiceObj.get<AgencyAllCandidatesListApiResponse>(url, true, params, true);
  
        if (response) {
          // avoid duplicating agency names
          const uniqueAgencyNames = Array.from(
            new Set(
              response.data
                .map((item: any) => item.agencyName)
                .filter((name: any) => !!name)
            )
          );
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
        console.error("Exception in Agency all candidates list", err);
      } finally {
        setIsLoading(false);
      }
    },
    [userDetails, pageSize, filters]
  );

// FETCHING THE JOBS
  const fetchAllJobs = useCallback(async () => {
      if (!userDetails?.email){
        toast.error("Email id not found",getToastOptions({}))
        return
      };
      if (!userDetails?.companyId) {
        toast.error("Company id not found",getToastOptions({}))
        return
      }

      setIsJobsLoading(true);
      try {
      const params = {
        pageSize: 200,
        sortOrder: "desc",
        dashboard: "CORPORATE",
        status: "PUBLISHED",
        includeCompanyDetails: true,
        includeCountCompanyJobEntityJobApplication:true,
        companyId: userDetails?.companyId ?? "",
      }
        const response  = await CorporateServiceObj.fetchJobs(params);
      
        if (response && Array.isArray(response.data)) {
          setFetchJobsData([
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
          const jobOptions = response.data.map((job: any) => {
          const title = job.jobTitle ?? job.title ?? job.name ?? `Job-${job.id ?? ""}`;
          const minSalary = job.salaryRange?.min ?? job.jobTitle?.salaryRange?.min ?? job.minSalary ?? "N/A";
          const maxSalary = job.salaryRange?.max ?? job.jobTitle?.salaryRange?.max ?? job.maxSalary ?? "N/A";
          const location = job.location?.fullLocation ?? job.jobTitle?.location?.fullLocation ?? job.location?.fullLocation ?? "N/A";
          // const label = `${title} | ${minSalary}LPA - ${maxSalary}LPA | ${location}`;
          const label = `${title}` 
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
    [userDetails, filters]
  );

  const fetchAllAgency = useCallback(async () => {
      if (!userDetails?.email){
        toast.error("Email id not found",getToastOptions({}))
        return
      };
      if (!userDetails?.companyId) {
        toast.error("Company id not found",getToastOptions({}))
        return
      }

      setIsAgencyLoading(true);
      try {
          setFetchAgencyData([
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
      fetchAllCandidatesData(1, pageSize, "", filters, false, "desc", selectedJobId, selectedAgencyName, searchBarText || "");
      fetchAllAgency();
    }
  }, [userDetails, fetchAllCandidatesData, pageSize, selectedJobId, selectedAgencyName, fetchAllAgency, filters, searchBarText]);
  
  useEffect(()=>{
    if (userDetails?.email && userDetails.companyId) {
        fetchAllJobs()
    }
  },[userDetails])

  const searchInputRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
  };

  const handlePageChange = useCallback((page: number) => {
      const lastKey = paginationKeysRef.current[page] || "";
      
      setCurrentPage(page);
      fetchAllCandidatesData(page, pageSize, lastKey, filters, false, "desc", selectedJobId, selectedAgencyName);
    },
    [fetchAllCandidatesData, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchAllCandidatesData(1, size, "", filters, false, "desc", selectedJobId, selectedAgencyName);
    },
    [fetchAllCandidatesData]
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

  const acceptAndMoveToApplicants = async() =>{
    setAcceptingCandidate(true);
    const payload = {
      candidates: selectedRows,
    };
    try {
      const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setFetchData((prevData) =>
        prevData.filter((candidate) =>
          !selectedRows.some((sel) => sel.id === candidate.id)
        )
      );
      toast.success("Candidate accepted and moved to applicants",getToastOptions({}))
      // console.log("Matching scores updated successfully!");
    } catch (error) {
      console.error("Error finding matching score:", error);
    } finally {
        setAcceptingCandidate(false);
        setSelectedRows([])
    }
  }
  
  // const rejectCandidate = async() =>{
  //   setRejectingCandidate(true);
  //   const payload = {
  //     candidates: selectedRows,
  //   };
  //   try {
  //     const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
  //     await new Promise((resolve) => setTimeout(resolve, 2000));
  //     setFetchData((prevData) =>
  //       prevData.filter((candidate) =>
  //         !selectedRows.some((sel) => sel.id === candidate.id)
  //       )
  //     );
  //     toast.success("Candidate rejected successfully",getToastOptions({}))
  //     // console.log("Matching scores updated successfully!");
  //   } catch (error) {
  //     console.error("Error finding matching score:", error);
  //   } finally {
  //       setRejectingCandidate(false);
  //       setSelectedRows([])
  //   }
  // }
  
  //old findmatchingscore
  // const findMatchingScore = async () =>{
  //   setScoreLoading(true);

  //   const candidatesToSend = selectedRows.filter(candidate => !candidate.score);
  //   console.log("Candidates to send:", candidatesToSend);
  //   const payload = {
  //     candidates: candidatesToSend,
  //   };

  //   try {
  //     const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
  //     await new Promise((resolve) => setTimeout(resolve, 2000));
  //     setFetchData((prevData) =>
  //       prevData.map((candidate) =>
  //         selectedRows.some((sel) => sel.id === candidate.id)
  //           ? { ...candidate, score: 80 }
  //           : candidate
  //       )
  //     );

  //     console.log("Matching scores updated successfully!");
  //   } catch (error) {
  //     console.error("Error finding matching score:", error);
  //   } finally {
  //       setScoreLoading(false);
  //   }
  // }
      
  const findMatchingScore = async () => {
    setScoreLoading(true);

    // Step 1: Copy selectedRows → dataFromParent (snapshot)
    const candidatesToSend = selectedRows.filter(c => !c.score);
    
    if (candidatesToSend.length === 0) {
      // console.log("No candidates need scoring.");
      setScoreLoading(false);
      return;
    }

    const onlyIds = candidatesToSend.map(details=>{
      return details.candidateParsedCvDetails.agencyUserSubmissionId
    })

    const payload = { agencyUserSubmissionIds: onlyIds };
    // console.log(payload)
    try {
      // Step 2: Start the scoring process once
      const {response, error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/agency-user-submission/find-matching-score/bulk`, payload, true, {}, true);
      if(response){
        toast.success(response.message,getToastOptions({}))
      }
      console.log(response,error);

      const startTime = Date.now();
      const pollingInterval = 50000;
      let remainingCandidates = [...candidatesToSend]; // Track locally

      const poll = async () => {
        try {
          const { response } = await httpServiceObj.get("/someapi/fetch", true, {}, true);

          if (response && Array.isArray(response)) {
            // Update fetchedData and track what's left
            const updatedIds = new Set<string>();

            setFetchData(prev =>
              prev.map(candidate => {
                const updated = response.find(
                  (r: any) => r.id === candidate.id && r.score != null
                );
                if (updated) {
                  updatedIds.add(candidate.id);
                  return { ...candidate, score: updated.score };
                }
                return candidate;
              })
            );

            // Remove scored candidates from tracking
            remainingCandidates = remainingCandidates.filter(
              item => !updatedIds.has(item.id)
            );

            // Stop if all scored
            if (remainingCandidates.length === 0) {
              console.log("✅ All scores received, stopping polling.");
              clearInterval(intervalId);
              setDataFromParent([]);
              setScoreLoading(false);
              return;
            }
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
        }

        // Check timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > 30000) {
          console.warn("⏰ Polling timed out after 30 seconds. Assigning default score 80.");
          clearInterval(intervalId);

          // Assign default score 80 to remaining candidates
          setFetchData(prev =>
            prev.map(candidate => {
              const isRemaining = remainingCandidates.some(r => r.id === candidate.id);
              if (isRemaining && (candidate.score == null || candidate.score === undefined)) {
                return { ...candidate, score: 80 };
              }
              return candidate;
            })
          );

          setDataFromParent([]);
          setScoreLoading(false);
        }
      };

      // Start polling
      const intervalId = setInterval(poll, pollingInterval);
      poll(); // Run immediately

    } catch (error) {
      console.error("Error finding matching score:", error);
      setScoreLoading(false);
    }
  };


  const sendForEvaluation = () =>{

  }
  const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
    setFetchData((prevData:any) => {
    if (!prevData || !Array.isArray(prevData)) return prevData;

    return prevData.map(job =>
      job.id === jobId ? { ...job, ...updatedData } : job
    );
    });
  }, []);

  // const handleLocalUpdateScore = useCallback((jobId: string, updatedData: any) => {
  //   setFetchData((prevData) =>
  //       prevData.map((candidate) =>
  //         selectedRows.some((sel) => sel.id === candidate.id)
  //           ? { ...candidate, score: 80 }
  //           : candidate
  //       )
  //     );
  // }, []);

  const isMatchingScore = (selectedRows: any[]): boolean => {
    for (const row of selectedRows) {
      if (row.score !== undefined && row.score !== null) {
        return false;
      }
    }
    return true;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap lg:items-center gap-2 w-full">
        <div className="w-full md:basis-full lg:flex-1">
          <SearchBarAgency
            searchBarText={searchBarText}
            setSearchBarText={setSearchBarText}
            handleClick={(e) => console.log(searchBarText)}
            placeholder="Search candidates by email"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto lg:w-auto items-stretch sm:items-center">
          <div className="flex w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
            <GenericDropdownAgency
              selectTitle="Select job"
              tooltipMessage="Select Status to filter applications"
              disabled={false}
              options={fetchJobsData}
              isJobsLoading={isJobsLoading}
              editable={true}
            />
          </div>

          <div className="flex w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
            <GenericDropdownAgency
              selectTitle="Select agency"
              tooltipMessage="Select Status to filter applications"
              disabled={true}
              options={fetchAgencyData}
              isJobsLoading={isAgencyLoading}
              editable={true}
            />
          </div>
        </div>

        <div className="w-full md:w-auto lg:w-auto">
          <div className="flex flex-row gap-2 justify-center items-center overflow-x-auto lg:overflow-visible">
            <button
              type="button"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Move to applicants"}
              className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-green-500 text-white hover:bg-green-700 "
              // disabled={selectedRows.length < 1 || acceptingCandidate}
              disabled={true}
              onClick={acceptAndMoveToApplicants}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              // disabled={selectedRows.length < 1 || rejectingCandidate}
              disabled={true}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Reject"}
              className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md border bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              // disabled={selectedRows.length < 1 || scoreLoading || !isMatchingScore(selectedRows)}
              disabled={true}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Find matching score"}
              onClick={findMatchingScore}
              className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-gradient-to-br from-cyan-300 to-cyan-500 text-white hover:to-cyan-700"
            >
              {/* match icon uses same size + stroke */}
              <RefreshCcw className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              // disabled={selectedRows.length < 1}
              disabled={true}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Send to evaluator"}
              onClick={() => setIsEvaluatorForm(true)}
              className="flex-none inline-flex items-center justify-center gap-2 h-9 rounded-lg px-3 text-xs transition shadow-md bg-blue-500 text-white hover:bg-blue-700"
            >
              <Send className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

      </div>

      <br />
      {isLoading? (
              <SkeletonLoader
                showTableHeader={true}
                showTableRows={true}
                tableColumns={5}
                rowCount={5}
              />
              ) : (
              <AgencyCandidateListTable
                data={fetchData}
                userType="CORPORATE"
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
      {/* localupdate required in rejectedcandidatemodal */}
        {/* <RejectCandidateModal
        onClose={()=>setIsRejecting(false)}
        isOpen={isRejecting}
        data={selectedRows}
        // onRefresh={()=>alert("closed")}
        // rejectCandidate={rejectCandidate}
        type={"multiple"}
        setFetchData={setFetchData}
        setSelectedRows={setSelectedRows}/> */}

      <Modal
        isOpen={isEvaluatorForm}
        onClose={() => setIsEvaluatorForm(false)}
        className="w-[90vw] sm:w-[455px] h-auto">
        {isEvaluatorForm &&
          <EvaluatorForm
          Defaultvalues={selectedRows as any}
          isBulk={true}
          onClose = {()=>setIsEvaluatorForm(false)}
          formLimit={10}/>
        }
      </Modal>
    </div>
  )
}

export default AgencyCandidateList
